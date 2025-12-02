#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Word2Vec Training Script
Train Word2Vec model với training data từ BugHunter chatbot
"""

import json
import sys
import argparse
from gensim.models import Word2Vec
from gensim.models.word2vec import LineSentence
import os
import io

# Fix encoding for Windows console - Set UTF-8 encoding
if sys.platform == 'win32':
    try:
        # Try to set UTF-8 encoding for stdout/stderr
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except (AttributeError, ValueError):
        # Fallback: use ASCII-safe encoding if UTF-8 fails
        pass

def train_word2vec(data_path, output_path, vector_size=100, window=5, min_count=1, workers=4, sg=1):
    """
    Train Word2Vec model
    
    Args:
        data_path: Đường dẫn đến file JSON chứa sentences
        output_path: Đường dẫn để lưu model
        vector_size: Kích thước vector (default: 100)
        window: Kích thước cửa sổ ngữ cảnh (default: 5)
        min_count: Số lần xuất hiện tối thiểu (default: 1)
        workers: Số luồng CPU (default: 4)
        sg: 1 cho Skip-gram, 0 cho CBOW (default: 1)
    """
    print(f"[Word2Vec] Đang đọc dữ liệu từ {data_path}...")
    
    # Đọc dữ liệu
    with open(data_path, 'r', encoding='utf-8') as f:
        sentences = json.load(f)
    
    print(f"[Word2Vec] Đã đọc {len(sentences)} sentences")
    
    if len(sentences) == 0:
        print("[Word2Vec] ❌ Không có dữ liệu để train")
        sys.exit(1)
    
    # Đảm bảo thư mục output tồn tại
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    print("[Word2Vec] Bắt đầu train model...")
    print(f"  - Vector size: {vector_size}")
    print(f"  - Window: {window}")
    print(f"  - Min count: {min_count}")
    print(f"  - Workers: {workers}")
    print(f"  - Algorithm: {'Skip-gram' if sg == 1 else 'CBOW'}")
    
    # Train model
    model = Word2Vec(
        sentences=sentences,
        vector_size=vector_size,
        window=window,
        min_count=min_count,
        workers=workers,
        sg=sg,  # 1 = Skip-gram, 0 = CBOW
        epochs=10,  # Số epochs để train
        hs=0,  # Use negative sampling
        negative=5,  # Negative sampling
        ns_exponent=0.75
    )
    
    print("[Word2Vec] Hoàn thành training")
    print(f"[Word2Vec] Vocabulary size: {len(model.wv)}")
    
    # Lưu model
    print(f"[Word2Vec] Đang lưu model vào {output_path}...")
    model.save(output_path)
    print(f"[Word2Vec] ✅ Model đã được lưu thành công!")
    
    # Hiển thị một số ví dụ
    if len(model.wv) > 0:
        print("\n[Word2Vec] Một số từ trong vocabulary:")
        sample_words = list(model.wv.key_to_index.keys())[:10]
        for word in sample_words:
            print(f"  - {word}")

def main():
    # Lấy đường dẫn thư mục chứa script này
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_dir = os.path.dirname(script_dir)
    models_dir = os.path.join(server_dir, 'models')
    
    # Đường dẫn mặc định
    default_data_path = os.path.join(models_dir, 'training_data.json')
    default_output_path = os.path.join(models_dir, 'word2vec.model')
    
    parser = argparse.ArgumentParser(
        description='Train Word2Vec model cho BugHunter chatbot',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f'''
Ví dụ sử dụng:
  # Sử dụng đường dẫn mặc định (từ thư mục server)
  python scripts/word2vec_train.py
  
  # Chỉ định đường dẫn file dữ liệu và output
  python scripts/word2vec_train.py --data models/training_data.json --output models/word2vec.model
  
  # Khuyến nghị: Sử dụng npm script từ thư mục gốc project
  npm run train-word2vec

Đường dẫn mặc định:
  --data: {default_data_path}
  --output: {default_output_path}
        '''
    )
    parser.add_argument('--data', default=default_data_path, 
                       help=f'Đường dẫn đến file JSON chứa sentences (default: {default_data_path})')
    parser.add_argument('--output', default=default_output_path,
                       help=f'Đường dẫn để lưu model (default: {default_output_path})')
    parser.add_argument('--vector-size', type=int, default=100, help='Kích thước vector (default: 100)')
    parser.add_argument('--window', type=int, default=5, help='Kích thước cửa sổ ngữ cảnh (default: 5)')
    parser.add_argument('--min-count', type=int, default=1, help='Số lần xuất hiện tối thiểu (default: 1)')
    parser.add_argument('--workers', type=int, default=4, help='Số luồng CPU (default: 4)')
    parser.add_argument('--sg', type=int, default=1, choices=[0, 1], help='1 cho Skip-gram, 0 cho CBOW (default: 1)')
    
    args = parser.parse_args()
    
    # Chuẩn hóa đường dẫn (xử lý đường dẫn tương đối)
    if not os.path.isabs(args.data):
        args.data = os.path.join(server_dir, args.data)
    if not os.path.isabs(args.output):
        args.output = os.path.join(server_dir, args.output)
    
    # Kiểm tra file dữ liệu tồn tại
    if not os.path.exists(args.data):
        print(f"[Word2Vec] ❌ File dữ liệu không tồn tại: {args.data}")
        print(f"[Word2Vec] 💡 Gợi ý: Hãy sử dụng 'npm run train-word2vec' từ thư mục gốc project để tự động tạo file dữ liệu từ MongoDB")
        print(f"[Word2Vec]    Hoặc đảm bảo file {args.data} tồn tại trước khi chạy script này")
        sys.exit(1)
    
    try:
        train_word2vec(
            args.data,
            args.output,
            vector_size=args.vector_size,
            window=args.window,
            min_count=args.min_count,
            workers=args.workers,
            sg=args.sg
        )
    except Exception as e:
        print(f"[Word2Vec] ❌ Lỗi khi train model: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()

