#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Word2Vec Query Script
Tính vector cho một câu từ Word2Vec model đã train
"""

import json
import sys
import argparse
from gensim.models import Word2Vec
import numpy as np

def get_sentence_vector(model_path, words):
    """
    Tính vector cho một câu bằng cách lấy trung bình các word vectors
    
    Args:
        model_path: Đường dẫn đến Word2Vec model
        words: Danh sách từ trong câu
    
    Returns:
        Vector đại diện cho câu
    """
    # Load model
    try:
        model = Word2Vec.load(model_path)
    except Exception as e:
        print(f"[Word2Vec Query] ❌ Không thể load model: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Lấy vectors cho các từ có trong vocabulary
    word_vectors = []
    for word in words:
        if word in model.wv:
            word_vectors.append(model.wv[word])
    
    # Nếu không có từ nào trong vocabulary, trả về vector 0
    if len(word_vectors) == 0:
        return [0.0] * model.wv.vector_size
    
    # Tính trung bình các word vectors
    sentence_vector = np.mean(word_vectors, axis=0)
    
    # Convert numpy array thành list
    return sentence_vector.tolist()

def main():
    parser = argparse.ArgumentParser(description='Tính vector cho câu từ Word2Vec model')
    parser.add_argument('--model', required=True, help='Đường dẫn đến Word2Vec model')
    parser.add_argument('--words', required=True, help='JSON array của các từ trong câu')
    
    args = parser.parse_args()
    
    try:
        # Parse words từ JSON
        words = json.loads(args.words)
        
        if not isinstance(words, list):
            print("[Word2Vec Query] ❌ Words phải là một JSON array", file=sys.stderr)
            sys.exit(1)
        
        # Tính vector
        vector = get_sentence_vector(args.model, words)
        
        # Output vector dưới dạng JSON
        print(json.dumps(vector))
        
    except json.JSONDecodeError as e:
        print(f"[Word2Vec Query] ❌ Lỗi parse JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[Word2Vec Query] ❌ Lỗi: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

