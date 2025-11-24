#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert training_data.json from database format to Word2Vec format
"""

import json
import sys
import re
import os
import io

# Fix encoding for Windows terminal
if sys.platform == 'win32':
    # Set UTF-8 encoding for stdout and stderr on Windows
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Vietnamese stopwords
STOPWORDS = {
    'là', 'cái', 'tôi', 'bạn', 'có', 'không', 'gì', 'nào', 'được', 'cách', 'sao', 'làm',
    'hỏi', 'muốn', 'cần', 'nó', 'nên', 'thì', 'này', 'kia', 'ở', 'đó', 'đây', 'và', 'hay',
    'hay là', 'hoặc', 'nhưng', 'mà', 'vì', 'cho', 'để', 'nếu', 'khi', 'giống', 'như', 'cũng',
    'lại', 'chỉ', 'khoảng', 'từ', 'đến', 'với', 'trong', 'trên', 'dưới', 'sau', 'trước',
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'do', 'does'
}

def preprocess_text(text):
    """Preprocess Vietnamese text: split words, lowercase, remove stopwords"""
    if not text:
        return []
    
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`[^`]+`', '', text)
    
    # Remove markdown formatting
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Bold
    text = re.sub(r'\*([^*]+)\*', r'\1', text)  # Italic
    
    # Lowercase, remove punctuation, split words
    words = re.sub(r'[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', ' ', text.lower(), flags=re.IGNORECASE) \
        .split()
    
    # Filter: length > 1, not stopword
    words = [w for w in words if len(w) > 1 and w not in STOPWORDS]
    
    return words

def convert_training_data(input_path, output_path):
    """Convert training data from database format to Word2Vec format"""
    print(f"[Convert] Đang đọc file: {input_path}")
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"[Convert] Đã đọc {len(data)} training data entries")
    
    sentences = []
    
    for item in data:
        # Process question
        question_words = preprocess_text(item.get('question', ''))
        if question_words:
            sentences.append(question_words)
        
        # Process answer (first 500 chars to avoid too long)
        answer = item.get('answer', '')
        if answer:
            answer_words = preprocess_text(answer[:500])
            if answer_words:
                sentences.append(answer_words)
        
        # Process tags
        tags = item.get('tags', [])
        if tags:
            for tag in tags:
                tag_words = preprocess_text(str(tag))
                if tag_words:
                    sentences.append(tag_words)
    
    print(f"[Convert] Đã tạo {len(sentences)} sentences")
    
    # Save converted data
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)
    
    print(f"[Convert] ✅ Đã lưu file: {output_path}")
    
    return sentences

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(script_dir)
    models_dir = os.path.join(server_dir, 'models')
    
    input_path = os.path.join(models_dir, 'training_data.json')
    output_path = os.path.join(models_dir, 'training_data_word2vec.json')
    
    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"[Convert] ❌ File không tồn tại: {input_path}")
        sys.exit(1)
    
    try:
        convert_training_data(input_path, output_path)
        print(f"[Convert] ✅ Hoàn thành! File output: {output_path}")
    except Exception as e:
        print(f"[Convert] ❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

