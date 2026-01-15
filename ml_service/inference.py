import torch
import torch.nn as nn
import pandas as pd
import math
import os
import re
from nltk.tokenize import word_tokenize
import nltk

# Download punkt if not available
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab')

from model import TransformerSeq2Seq, create_mask, sql_tokenizer

# Device configuration
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class Text2SQLModel:
    def __init__(self, model_path='../best-model-transformer-advanced-tokenization.pt', data_path='../training_data1.csv'):
        self.model_path = model_path
        self.data_path = data_path
        self.model = None
        self.token_to_id = {}
        self.id_to_token = {}
        self.pad_idx = 0
        self.sos_idx = 0
        self.eos_idx = 0
        self.unk_idx = 0
        
        self._initialize()

    def _initialize(self):
        print("Loading data and rebuilding vocabulary...")
        
        # Load training data to rebuild vocabulary
        # Assumes the CSV has 'Text Description' and 'SQL Query' columns
        if not os.path.exists(self.data_path):
             # Try local path if relative path fails (e.g. running from ml_service dir)
            if os.path.exists('training_data.csv'):
                self.data_path = 'training_data.csv'
            elif os.path.exists('../training_data.csv'):
                self.data_path = '../training_data.csv'
            elif os.path.exists('training_data1.csv'):
                self.data_path = 'training_data1.csv'
            elif os.path.exists('../training_data1.csv'):
                self.data_path = '../training_data1.csv'
            else:
                raise FileNotFoundError(f"Could not find training data at {self.data_path}")
                
        df = pd.read_csv(self.data_path)
        
        all_tokens_combined = []
        
        # Tokenize questions
        print("Tokenizing questions...")
        for text in df['Text Description']:
            if isinstance(text, str):
                all_tokens_combined.extend(word_tokenize(text.lower()))
        
        # Tokenize SQL
        print("Tokenizing SQL...")
        for sql in df['SQL Query']:
            if isinstance(sql, str):
                all_tokens_combined.extend(sql_tokenizer(sql))
                
        # Special tokens
        PAD_TOKEN = '<pad>'
        SOS_TOKEN = '<sos>'
        EOS_TOKEN = '<eos>'
        UNK_TOKEN = '<unk>'
        
        special_tokens = [PAD_TOKEN, SOS_TOKEN, EOS_TOKEN, UNK_TOKEN]
        self.unique_tokens = special_tokens + list(sorted(set(all_tokens_combined) - set(special_tokens)))
        
        self.token_to_id = {token: i for i, token in enumerate(self.unique_tokens)}
        self.id_to_token = {i: token for token, i in self.token_to_id.items()}
        
        self.pad_idx = self.token_to_id[PAD_TOKEN]
        self.sos_idx = self.token_to_id[SOS_TOKEN]
        self.eos_idx = self.token_to_id[EOS_TOKEN]
        self.unk_idx = self.token_to_id[UNK_TOKEN]
        
        vocab_size = len(self.token_to_id)
        print(f"Vocabulary Size: {vocab_size}")
        
        # Hyperparameters (Must match training)
        INPUT_DIM = vocab_size
        OUTPUT_DIM = vocab_size
        D_MODEL = 256
        NHEAD = 8
        NUM_ENCODER_LAYERS = 3
        NUM_DECODER_LAYERS = 3
        DIM_FEEDFORWARD = 512
        TRANSFORMER_DROPOUT = 0.1
        
        self.model = TransformerSeq2Seq(
            INPUT_DIM, OUTPUT_DIM, D_MODEL, NHEAD, NUM_ENCODER_LAYERS, NUM_DECODER_LAYERS, DIM_FEEDFORWARD, TRANSFORMER_DROPOUT
        ).to(device)
        
        # Load weights
        print(f"Loading model weights from {self.model_path}...")
        
        real_model_path = self.model_path
        if not os.path.exists(real_model_path):
             if os.path.exists('../best-model-transformer-advanced-tokenization.pt'):
                 real_model_path = '../best-model-transformer-advanced-tokenization.pt'
             elif os.path.exists('best-model-transformer-advanced-tokenization.pt'):
                 real_model_path = 'best-model-transformer-advanced-tokenization.pt'
        
        if os.path.exists(real_model_path):
            self.model.load_state_dict(torch.load(real_model_path, map_location=device))
            self.model.eval()
            print("Model loaded successfully.")
        else:
            print("Warning: Model weights file not found. Using initialized weights (random).")

    def predict(self, question, max_len=100):
        self.model.eval()
        with torch.no_grad():
            tokens = word_tokenize(question.lower())
            question_ids = [self.token_to_id.get(token, self.unk_idx) for token in tokens]
            src_tensor = torch.tensor(question_ids, dtype=torch.long).unsqueeze(0).to(device)
            
            src_padding_mask = (src_tensor == self.pad_idx)
            
            src_embedded = self.model.embedding(src_tensor) * math.sqrt(self.model.d_model)
            src_pos_encoded = self.model.pos_encoder(src_embedded.transpose(0, 1)).transpose(0, 1)
            memory = self.model.transformer_encoder(src_pos_encoded, src_key_padding_mask=src_padding_mask)
            
            tgt_tensor = torch.ones(1, 1).fill_(self.sos_idx).type(torch.long).to(device)
            predicted_sql_ids = [self.sos_idx]
            
            for _ in range(max_len):
                tgt_seq_len = tgt_tensor.shape[1]
                tgt_mask = torch.triu(torch.ones((tgt_seq_len, tgt_seq_len), device=device), diagonal=1).bool()
                tgt_padding_mask = (tgt_tensor == self.pad_idx)
                
                tgt_embedded = self.model.tgt_embedding(tgt_tensor) * math.sqrt(self.model.d_model)
                tgt_pos_encoded = self.model.pos_decoder(tgt_embedded.transpose(0, 1)).transpose(0, 1)
                
                output = self.model.transformer_decoder(
                    tgt_pos_encoded, memory, tgt_mask=tgt_mask, 
                    tgt_key_padding_mask=tgt_padding_mask,
                    memory_key_padding_mask=src_padding_mask
                )
                
                pred_token_id = self.model.fc_out(output[:, -1, :]).argmax(1).item()
                
                if pred_token_id >= len(self.id_to_token):
                    pred_token_id = self.unk_idx
                
                predicted_sql_ids.append(pred_token_id)
                
                if pred_token_id == self.eos_idx:
                    break
                
                tgt_tensor = torch.cat([tgt_tensor, torch.tensor([[pred_token_id]], dtype=torch.long).to(device)], dim=1)
            
            predicted_sql_tokens = [self.id_to_token.get(id, '<unk>') for id in predicted_sql_ids]
            
            try:
                eos_index = predicted_sql_tokens.index('<eos>')
            except ValueError:
                eos_index = len(predicted_sql_tokens)
            
            predicted_sql = " ".join(predicted_sql_tokens[1:eos_index])
            
            # --- Post-processing Heuristics ---
            # Fix "LIMIT ;" -> "LIMIT 1;"
            predicted_sql = re.sub(r'LIMIT\s*;', 'LIMIT 1;', predicted_sql, flags=re.IGNORECASE)
            
            # Fix "LIMIT" at the very end -> "LIMIT 1"
            predicted_sql = re.sub(r'LIMIT\s*$', 'LIMIT 1', predicted_sql, flags=re.IGNORECASE)
            
            # Ensure it doesn't end with a hanging comparison like "WHERE amount > ;" (less likely but good safety)
            # Remove semi-colon for now to be safe, or ensure it exists? 
            # SQLite driver often doesn't need it, but doesn't hurt.
            
            return predicted_sql

# Singleton instance for server usage
_model_instance = None

def get_model():
    global _model_instance
    if _model_instance is None:
        _model_instance = Text2SQLModel()
    return _model_instance

if __name__ == "__main__":
    # Test run
    model = get_model()
    test_q = "List all categories"
    print(f"Question: {test_q}")
    print(f"SQL: {model.predict(test_q)}")
