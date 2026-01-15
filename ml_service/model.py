import torch
import torch.nn as nn
import math
import re

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, dropout, max_len=5000):
        super(PositionalEncoding, self).__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        self.register_buffer('pe', pe)

    def forward(self, x):
        # x: [seq_len, batch_size, embedding_dim]
        x = x + self.pe[:x.size(0), :]
        return self.dropout(x)

class TransformerSeq2Seq(nn.Module):
    def __init__(self, input_dim, output_dim, d_model, nhead, num_encoder_layers, num_decoder_layers, dim_feedforward, dropout):
        super().__init__()

        self.d_model = d_model
        self.embedding = nn.Embedding(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout)

        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_encoder_layers)

        self.tgt_embedding = nn.Embedding(output_dim, d_model)
        self.pos_decoder = PositionalEncoding(d_model, dropout)

        decoder_layer = nn.TransformerDecoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.transformer_decoder = nn.TransformerDecoder(decoder_layer, num_decoder_layers)

        self.fc_out = nn.Linear(d_model, output_dim)

    def forward(self, src, tgt, src_mask, tgt_mask, src_padding_mask, tgt_padding_mask, memory_key_padding_mask):
        # src: [batch_size, src_len]
        # tgt: [batch_size, tgt_len]
        
        src = self.embedding(src) * math.sqrt(self.d_model)
        src = self.pos_encoder(src.transpose(0, 1)).transpose(0, 1)

        memory = self.transformer_encoder(src, src_key_padding_mask=src_padding_mask)

        tgt = self.tgt_embedding(tgt) * math.sqrt(self.d_model)
        tgt = self.pos_decoder(tgt.transpose(0, 1)).transpose(0, 1)

        output = self.transformer_decoder(tgt, memory, tgt_mask=tgt_mask, memory_mask=None,
                                          tgt_key_padding_mask=tgt_padding_mask,
                                          memory_key_padding_mask=memory_key_padding_mask)

        output = self.fc_out(output)

        return output

def create_mask(src, tgt, pad_idx):
    src_seq_len = src.shape[1]
    tgt_seq_len = tgt.shape[1]

    tgt_mask = torch.triu(torch.ones((tgt_seq_len, tgt_seq_len), device=src.device), diagonal=1).bool()
    src_mask = None

    src_padding_mask = (src == pad_idx)
    tgt_padding_mask = (tgt == pad_idx)
    memory_key_padding_mask = src_padding_mask

    return src_mask, tgt_mask, src_padding_mask, tgt_padding_mask, memory_key_padding_mask

def sql_tokenizer(sql_query):
    # Patterns for SQL keywords, operators, and punctuation
    sql_patterns = [
        r"--.*?\n",            # SQL comments
        r"\bSELECT\b",
        r"\bFROM\b",
        r"\bWHERE\b",
        r"\bJOIN\b",
        r"\bON\b",
        r"\bGROUP BY\b",
        r"\bORDER BY\b",
        r"\bLIMIT\b",
        r"\bHAVING\b",
        r"\bCOUNT\b",
        r"\bSUM\b",
        r"\bAVG\b",
        r"\bMAX\b",
        r"\bMIN\b",
        r"\bAS\b",
        r"\bBETWEEN\b",
        r"\bAND\b",
        r"\bOR\b",
        r"\bNOT\b",
        r"\bLIKE\b",
        r"\bIN\b",
        r"\bIS\b",
        r"\bNULL\b",
        r"\bCREATE\b",
        r"\bTABLE\b",
        r"\bPRIMARY KEY\b",
        r"\bFOREIGN KEY\b",
        r"\bREFERENCES\b",
        r"\bDEFAULT\b",
        r"\bCURRENT_TIMESTAMP\b",
        r"INTEGER\b",
        r"TEXT\b",
        r"DATE\b",
        r"DATETIME\b",
        r"REAL\b",
        r"UNIQUE\b",
        r"NOT NULL\b",
        r"\[0-9a-zA-Z_]+\]", # For identifiers enclosed in brackets
        r"\s+",                # Whitespace
        r"==", r"!=", r">=", r"<=", r"<>", # Comparison operators
        r"=", r">", r"<", # Single comparison operators
        r"\*", r"\+", r"-", r"/", r"%", # Arithmetic operators
        r"\(", r"\)", r"\,", r"\;", r"\.", # Punctuation
        r"'[^']+'",             # Single-quoted strings
        r"`[^`]+`",             # Backtick-quoted identifiers
        r'"[^"]+"',             # Double-quoted identifiers
        r"[a-zA-Z_][a-zA-Z0-9_]*" # Identifiers
    ]

    token_pattern = re.compile('|'.join(sql_patterns), re.IGNORECASE | re.VERBOSE)
    tokens = [match.group(0).strip() for match in token_pattern.finditer(sql_query) if match.group(0).strip() != '']
    return tokens
