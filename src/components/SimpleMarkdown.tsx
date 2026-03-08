import React from 'react';
import { Text, TextStyle, StyleSheet, View } from 'react-native';
import { ResponseFormat } from '../services/ChatService';
import { FONT_SIZE } from '@src/styles/theme';

interface SimpleMarkdownProps {
    text: string;
    format: ResponseFormat;
    baseStyle?: TextStyle;
    boldColor?: string;
}

/**
 * Simple markdown renderer for our safe subset:
 * - **bold** text
 * - *italic* text
 * - Bullet points (•, -)
 * - Basic structure (no tables yet)
 * 
 * For PLAIN format, renders as-is.
 * For MARKDOWN format, parses inline formatting.
 */
export const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({
    text,
    format,
    baseStyle,
    boldColor,
}) => {
    if (format === 'PLAIN' || !text) {
        return <Text style={baseStyle}>{text}</Text>;
    }

    // Parse and render markdown
    const lines = text.split('\n');

    return (
        <View style={{ alignSelf: 'stretch' }}>
            {lines.map((line, index) => (
                <MarkdownLine
                    key={index}
                    line={line}
                    baseStyle={baseStyle}
                    boldColor={boldColor}
                    isLastLine={index === lines.length - 1}
                />
            ))}
        </View>
    );
};

interface MarkdownLineProps {
    line: string;
    baseStyle?: TextStyle;
    boldColor?: string;
    isLastLine?: boolean;
}

const MarkdownLine: React.FC<MarkdownLineProps> = ({
    line,
    baseStyle,
    boldColor,
    isLastLine
}) => {
    // Empty line = spacing
    if (!line.trim()) {
        return <View style={{ height: 8 }} />;
    }

    // Horizontal rule (---)
    if (line.trim().match(/^-{3,}$/)) {
        return <View style={{ height: 1, backgroundColor: 'rgba(128,128,128,0.3)', marginVertical: 8 }} />;
    }

    // Table detection
    if (line.startsWith('|') && line.endsWith('|')) {
        // Simple table row rendering
        const cells = line.slice(1, -1).split('|').map(c => c.trim());
        if (cells.every(c => c.match(/^[-:]+$/))) {
            // Header separator row - skip
            return null;
        }
        return (
            <View style={styles.tableRow}>
                {cells.map((cell, i) => {
                    const isLast = i === cells.length - 1;
                    return (
                        <Text
                            key={i}
                            style={[
                                baseStyle,
                                // Name column (first) uses flex style, Amount (last) uses fixed width style
                                i === 0 ? styles.tableCell : styles.tableCellAmount,
                            ]}
                            numberOfLines={i === cells.length - 1 ? 1 : undefined}
                        >
                            {parseInlineMarkdown(cell, baseStyle, boldColor)}
                        </Text>
                    );
                })}
            </View>
        );
    }

    // Bullet points
    const bulletMatch = line.match(/^(\s*)(•|-|\*)\s+(.+)$/);
    if (bulletMatch) {
        const [, indent, , content] = bulletMatch;
        const indentLevel = Math.floor(indent.length / 2);
        return (
            <View style={[styles.bulletLine, { marginLeft: indentLevel * 12 }]}>
                <Text style={[baseStyle, styles.bullet]}>•</Text>
                <Text style={[baseStyle, styles.bulletContent, !isLastLine && { marginBottom: 2 }]}>
                    {parseInlineMarkdown(content, baseStyle, boldColor)}
                </Text>
            </View>
        );
    }

    // Heading (## text)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
        const [, hashes, content] = headingMatch;
        const level = hashes.length;
        // Base text is usually 16, so headings must be larger
        const fontSize = level === 1 ? FONT_SIZE.xxl : level === 2 ? FONT_SIZE.xl : FONT_SIZE.base;
        return (
            <Text style={[baseStyle, { fontSize, fontWeight: '600', marginBottom: 4 }]}>
                {parseInlineMarkdown(content, baseStyle, boldColor)}
            </Text>
        );
    }

    // Italic line prefix (_text_)
    // Regular line with inline formatting
    return (
        <Text style={[baseStyle, !isLastLine && { marginBottom: 1 }]}>
            {parseInlineMarkdown(line, baseStyle, boldColor)}
        </Text>
    );
};

/**
 * Parse inline markdown: **bold**, *italic*, `code`
 */
function parseInlineMarkdown(
    text: string,
    baseStyle?: TextStyle,
    boldColor?: string
): React.ReactNode[] {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        // Bold: **text**
        const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s);
        if (boldMatch) {
            const [, before, bold, after] = boldMatch;
            if (before) elements.push(<Text key={key++}>{before}</Text>);
            elements.push(
                <Text key={key++} style={{ fontWeight: '700', color: boldColor }}>
                    {bold}
                </Text>
            );
            remaining = after;
            continue;
        }

        // Italic: *text* or _text_
        const italicMatch = remaining.match(/^(.*?)(?:\*(.+?)\*|_(.+?)_)(.*)$/s);
        if (italicMatch) {
            const [, before, italic1, italic2, after] = italicMatch;
            if (before) elements.push(<Text key={key++}>{before}</Text>);
            elements.push(
                <Text key={key++} style={{ fontStyle: 'italic', opacity: 0.8 }}>
                    {italic1 || italic2}
                </Text>
            );
            remaining = after;
            continue;
        }

        // Code: `text`
        const codeMatch = remaining.match(/^(.*?)`(.+?)`(.*)$/s);
        if (codeMatch) {
            const [, before, code, after] = codeMatch;
            if (before) elements.push(<Text key={key++}>{before}</Text>);
            elements.push(
                <Text
                    key={key++}
                    style={{
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        paddingHorizontal: 4,
                        borderRadius: 3,
                    }}
                >
                    {code}
                </Text>
            );
            remaining = after;
            continue;
        }

        // No more matches - add remaining text
        elements.push(<Text key={key++}>{remaining}</Text>);
        break;
    }

    return elements;
}

const styles = StyleSheet.create({
    bulletLine: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    bullet: {
        width: 16,
        textAlign: 'center',
    },
    bulletContent: {
        flex: 1,
    }, tableRow: {
        flexDirection: 'row',
        paddingVertical: 4,
        alignItems: 'flex-start',
    },

    tableCell: {
        flex: 1,
        paddingRight: 8,
        minWidth: 120,
        flexShrink: 0,
    },

    tableCellAmount: {
        width: 72,
        textAlign: 'right',
        flexShrink: 0,
    },

});

export default SimpleMarkdown;
