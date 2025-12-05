# Code Chuẩn Các Bài Tập Python

Tài liệu này chứa code chuẩn (correct solutions) cho 6 bài tập Python đã được import vào database.

---

## 📚 Mục Lục

1. [Bài Dễ](#bài-dễ)
   - [1. Tính Tổng Hai Số](#1-tính-tổng-hai-số)
   - [2. Kiểm Tra Số Chẵn Lẻ](#2-kiểm-tra-số-chẵn-lẻ)
   - [3. Đếm Ký Tự Trong Chuỗi](#3-đếm-ký-tự-trong-chuỗi)
2. [Bài Trung Bình](#bài-trung-bình)
   - [4. Tìm Số Lớn Nhất Trong Danh Sách](#4-tìm-số-lớn-nhất-trong-danh-sách)
   - [5. Đảo Ngược Chuỗi](#5-đảo-ngược-chuỗi)
3. [Bài Khó](#bài-khó)
   - [6. Chuỗi Con Palindrome Dài Nhất](#6-chuỗi-con-palindrome-dài-nhất)

---

## Bài Dễ

### 1. Tính Tổng Hai Số

**Độ khó:** Easy  
**Điểm:** 100  
**Token thưởng:** 1  
**Thời gian:** 5 giây  
**Bộ nhớ:** 128 MB

#### Đề bài
Viết hàm [`sum_two_numbers(a, b)`](server/scripts/seed-python-challenges.ts:23) tính tổng của hai số nguyên.

#### Code chuẩn

```python
def sum_two_numbers(a, b):
    return a + b
```

#### Giải thích
- Sử dụng toán tử `+` để cộng hai số
- Toán tử `+` hoạt động với mọi kiểu số (int, float)
- Time complexity: O(1)
- Space complexity: O(1)

#### Test Cases
```python
# Test 1
assert sum_two_numbers(5, 3) == 8

# Test 2
assert sum_two_numbers(-10, 20) == 10

# Test 3
assert sum_two_numbers(0, 0) == 0

# Test 4 (Hidden)
assert sum_two_numbers(100, -50) == 50

# Test 5 (Hidden)
assert sum_two_numbers(-999, -1) == -1000
```

---

### 2. Kiểm Tra Số Chẵn Lẻ

**Độ khó:** Easy  
**Điểm:** 100  
**Token thưởng:** 1  
**Thời gian:** 5 giây  
**Bộ nhớ:** 128 MB

#### Đề bài
Viết hàm [`is_even(n)`](server/scripts/seed-python-challenges.ts:97) kiểm tra số nguyên n có phải là số chẵn hay không.

#### Code chuẩn

```python
def is_even(n):
    return n % 2 == 0
```

#### Giải thích
- Số chẵn chia hết cho 2 (dư 0)
- Toán tử `%` (modulo) trả về số dư của phép chia
- Nếu `n % 2 == 0` thì n là số chẵn
- Time complexity: O(1)
- Space complexity: O(1)

#### Test Cases
```python
# Test 1
assert is_even(4) == True

# Test 2
assert is_even(7) == False

# Test 3
assert is_even(0) == True

# Test 4 (Hidden)
assert is_even(-6) == True

# Test 5 (Hidden)
assert is_even(-15) == False
```

---

### 3. Đếm Ký Tự Trong Chuỗi

**Độ khó:** Easy  
**Điểm:** 100  
**Token thưởng:** 1  
**Thời gian:** 5 giây  
**Bộ nhớ:** 128 MB

#### Đề bài
Viết hàm [`count_chars(s)`](server/scripts/seed-python-challenges.ts:165) đếm số lượng ký tự (không tính khoảng trắng) trong chuỗi s.

#### Code chuẩn

```python
def count_chars(s):
    return len(s.replace(' ', ''))
```

#### Giải thích
- Sử dụng [`replace(' ', '')`](server/scripts/seed-python-challenges.ts:167) để loại bỏ tất cả khoảng trắng
- Sau đó dùng [`len()`](server/scripts/seed-python-challenges.ts:167) để đếm số ký tự còn lại
- Time complexity: O(n) - n là độ dài chuỗi
- Space complexity: O(n) - tạo chuỗi mới

#### Giải pháp thay thế
```python
# Cách 2: Sử dụng vòng lặp
def count_chars(s):
    count = 0
    for char in s:
        if char != ' ':
            count += 1
    return count

# Cách 3: Sử dụng list comprehension
def count_chars(s):
    return len([c for c in s if c != ' '])

# Cách 4: Sử dụng filter
def count_chars(s):
    return len(list(filter(lambda c: c != ' ', s)))
```

#### Test Cases
```python
# Test 1
assert count_chars('Hello World') == 10

# Test 2
assert count_chars('Python Programming') == 17

# Test 3
assert count_chars('   ') == 0

# Test 4 (Hidden)
assert count_chars('a b c d e') == 5

# Test 5 (Hidden)
assert count_chars('NoSpacesHere') == 12
```

---

## Bài Trung Bình

### 4. Tìm Số Lớn Nhất Trong Danh Sách

**Độ khó:** Medium  
**Điểm:** 200  
**Token thưởng:** 2  
**Thời gian:** 10 giây  
**Bộ nhớ:** 256 MB

#### Đề bài
Viết hàm [`find_max(numbers)`](server/scripts/seed-python-challenges.ts:239) tìm và trả về số lớn nhất trong danh sách numbers.

#### Code chuẩn (Cách 1)

```python
def find_max(numbers):
    return max(numbers)
```

#### Giải thích Cách 1
- Sử dụng hàm built-in [`max()`](server/scripts/seed-python-challenges.ts:241) của Python
- Hàm `max()` tự động tìm giá trị lớn nhất trong iterable
- Đây là cách đơn giản và hiệu quả nhất
- Time complexity: O(n)
- Space complexity: O(1)

#### Code chuẩn (Cách 2 - Thủ công)

```python
def find_max(numbers):
    max_num = numbers[0]
    for num in numbers:
        if num > max_num:
            max_num = num
    return max_num
```

#### Giải thích Cách 2
- Khởi tạo `max_num` bằng phần tử đầu tiên
- Duyệt qua từng phần tử trong list
- Cập nhật `max_num` nếu tìm thấy số lớn hơn
- Time complexity: O(n)
- Space complexity: O(1)

#### Giải pháp thay thế
```python
# Cách 3: Sử dụng reduce
from functools import reduce

def find_max(numbers):
    return reduce(lambda a, b: a if a > b else b, numbers)

# Cách 4: Sử dụng sorted
def find_max(numbers):
    return sorted(numbers)[-1]  # O(n log n) - không tối ưu

# Cách 5: Sử dụng recursion
def find_max(numbers):
    if len(numbers) == 1:
        return numbers[0]
    return max(numbers[0], find_max(numbers[1:]))
```

#### Test Cases
```python
# Test 1
numbers = [1, 5, 3, 9, 2]
assert find_max(numbers) == 9

# Test 2
numbers = [-5, -2, -10, -1]
assert find_max(numbers) == -1

# Test 3
numbers = [42]
assert find_max(numbers) == 42

# Test 4 (Hidden)
numbers = [100, 200, 150, 175, 225]
assert find_max(numbers) == 225

# Test 5 (Hidden)
numbers = [-1000, -999, -1001, -500]
assert find_max(numbers) == -500
```

---

### 5. Đảo Ngược Chuỗi

**Độ khó:** Medium  
**Điểm:** 200  
**Token thưởng:** 2  
**Thời gian:** 10 giây  
**Bộ nhớ:** 256 MB

#### Đề bài
Viết hàm [`reverse_string(s)`](server/scripts/seed-python-challenges.ts:337) trả về chuỗi s sau khi đảo ngược.

#### Code chuẩn (Cách 1 - Pythonic)

```python
def reverse_string(s):
    return s[::-1]
```

#### Giải thích Cách 1
- Sử dụng slicing với bước `-1` để đảo ngược chuỗi
- `[::-1]` nghĩa là lấy toàn bộ chuỗi từ cuối về đầu
- Đây là cách pythonic và hiệu quả nhất
- Time complexity: O(n)
- Space complexity: O(n) - tạo chuỗi mới

#### Code chuẩn (Cách 2)

```python
def reverse_string(s):
    return ''.join(reversed(s))
```

#### Giải thích Cách 2
- Hàm `reversed()` trả về iterator đảo ngược
- `join()` ghép các ký tự lại thành chuỗi
- Time complexity: O(n)
- Space complexity: O(n)

#### Giải pháp thay thế
```python
# Cách 3: Sử dụng vòng lặp
def reverse_string(s):
    result = ''
    for char in s:
        result = char + result
    return result

# Cách 4: Sử dụng list
def reverse_string(s):
    chars = list(s)
    chars.reverse()
    return ''.join(chars)

# Cách 5: Sử dụng stack
def reverse_string(s):
    stack = []
    for char in s:
        stack.append(char)
    result = ''
    while stack:
        result += stack.pop()
    return result

# Cách 6: Sử dụng recursion
def reverse_string(s):
    if len(s) <= 1:
        return s
    return reverse_string(s[1:]) + s[0]
```

#### Test Cases
```python
# Test 1
assert reverse_string('hello') == 'olleh'

# Test 2
assert reverse_string('Python') == 'nohtyP'

# Test 3
assert reverse_string('12345') == '54321'

# Test 4 (Hidden)
assert reverse_string('a') == 'a'

# Test 5 (Hidden)
assert reverse_string('racecar') == 'racecar'  # Palindrome
```

---

## Bài Khó

### 6. Chuỗi Con Palindrome Dài Nhất

**Độ khó:** Hard  
**Điểm:** 300  
**Token thưởng:** 3  
**Thời gian:** 15 giây  
**Bộ nhớ:** 256 MB

#### Đề bài
Viết hàm [`longest_palindrome(s)`](server/scripts/seed-python-challenges.ts:435) tìm chuỗi con palindrome dài nhất trong chuỗi s.

**Palindrome** là chuỗi đọc xuôi và đọc ngược giống nhau (ví dụ: "aba", "racecar").

#### Code chuẩn (Cách 1 - Expand Around Center)

```python
def longest_palindrome(s):
    if not s:
        return ""
    
    def expand_around_center(left, right):
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        return s[left + 1:right]
    
    longest = ""
    for i in range(len(s)):
        # Palindrome độ dài lẻ (tâm là 1 ký tự)
        palindrome1 = expand_around_center(i, i)
        # Palindrome độ dài chẵn (tâm là 2 ký tự)
        palindrome2 = expand_around_center(i, i + 1)
        
        # Cập nhật longest
        longest = max([longest, palindrome1, palindrome2], key=len)
    
    return longest
```

#### Giải thích Cách 1
- **Thuật toán mở rộng từ tâm (Expand Around Center)**
- Với mỗi vị trí, ta mở rộng ra hai bên để tìm palindrome
- Xét cả trường hợp độ dài chẵn và lẻ:
  - Độ dài lẻ: tâm là 1 ký tự (i, i)
  - Độ dài chẵn: tâm là 2 ký tự (i, i+1)
- **Time complexity:** O(n²) - n vị trí, mỗi vị trí mở rộng tối đa n lần
- **Space complexity:** O(1) - chỉ lưu vài biến

#### Code chuẩn (Cách 2 - Dynamic Programming)

```python
def longest_palindrome(s):
    n = len(s)
    if n < 2:
        return s
    
    # dp[i][j] = True nếu s[i:j+1] là palindrome
    dp = [[False] * n for _ in range(n)]
    start = 0
    max_len = 1
    
    # Mọi ký tự đơn là palindrome
    for i in range(n):
        dp[i][i] = True
    
    # Kiểm tra chuỗi độ dài 2
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            start = i
            max_len = 2
    
    # Kiểm tra chuỗi độ dài >= 3
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                start = i
                max_len = length
    
    return s[start:start + max_len]
```

#### Giải thích Cách 2
- **Dynamic Programming approach**
- Lưu trạng thái palindrome của mọi chuỗi con trong bảng 2D
- **Công thức DP:**
  - Nếu `s[i] == s[j]` và `s[i+1:j]` là palindrome
  - Thì `s[i:j+1]` cũng là palindrome
- **Time complexity:** O(n²)
- **Space complexity:** O(n²) - bảng DP

#### Giải pháp thay thế
```python
# Cách 3: Manacher's Algorithm (Tối ưu nhất)
def longest_palindrome(s):
    # Thêm ký tự đặc biệt để xử lý palindrome chẵn/lẻ thống nhất
    T = '#'.join('^{}$'.format(s))
    n = len(T)
    P = [0] * n  # P[i] = bán kính palindrome tại i
    C = R = 0    # C = tâm, R = biên phải
    
    for i in range(1, n - 1):
        # Mirror của i qua C
        P[i] = (R > i) and min(R - i, P[2 * C - i])
        
        # Mở rộng palindrome tại i
        while T[i + 1 + P[i]] == T[i - 1 - P[i]]:
            P[i] += 1
        
        # Cập nhật C và R nếu mở rộng qua R
        if i + P[i] > R:
            C, R = i, i + P[i]
    
    # Tìm palindrome dài nhất
    max_len, center_index = max((n, i) for i, n in enumerate(P))
    start = (center_index - max_len) // 2
    return s[start:start + max_len]

# Time: O(n), Space: O(n)
```

#### So sánh các phương pháp

| Phương pháp | Time | Space | Độ khó | Ghi chú |
|-------------|------|-------|--------|---------|
| Expand Around Center | O(n²) | O(1) | Trung bình | Dễ hiểu, code ngắn |
| Dynamic Programming | O(n²) | O(n²) | Trung bình | Dễ chứng minh đúng |
| Manacher's Algorithm | O(n) | O(n) | Khó | Tối ưu nhất, khó cài đặt |

#### Test Cases
```python
# Test 1
assert longest_palindrome('babad') == 'bab'  # hoặc 'aba'

# Test 2
assert longest_palindrome('cbbd') == 'bb'

# Test 3
assert longest_palindrome('racecar') == 'racecar'

# Test 4 (Hidden)
assert longest_palindrome('abc') == 'a'  # hoặc 'b' hoặc 'c'

# Test 5 (Hidden)
assert longest_palindrome('abacabad') == 'abacaba'
```

#### Edge Cases
```python
# Chuỗi rỗng
assert longest_palindrome('') == ''

# Chuỗi 1 ký tự
assert longest_palindrome('a') == 'a'

# Toàn bộ chuỗi là palindrome
assert longest_palindrome('abccba') == 'abccba'

# Không có palindrome độ dài > 1
assert longest_palindrome('abcd') in ['a', 'b', 'c', 'd']

# Palindrome chồng chéo
assert longest_palindrome('aaaa') == 'aaaa'
```

---

## 📊 Tổng Kết

### Phân loại theo độ khó

| Độ khó | Số lượng | Tổng điểm | Tổng token |
|--------|----------|-----------|------------|
| Easy | 3 | 300 | 3 |
| Medium | 2 | 400 | 4 |
| Hard | 1 | 300 | 3 |
| **Tổng** | **6** | **1000** | **10** |

### Kiến thức cần thiết

#### Bài Dễ
- ✅ Toán tử cơ bản (+, %, len)
- ✅ String methods (replace)
- ✅ Boolean logic
- ✅ Built-in functions

#### Bài Trung Bình
- ✅ List operations
- ✅ Iteration (for loops)
- ✅ String slicing
- ✅ Comparison operators
- ✅ Built-in functions (max, reversed, join)

#### Bài Khó
- ✅ Two-pointer technique
- ✅ Algorithm design
- ✅ Dynamic Programming
- ✅ String manipulation
- ✅ Optimization techniques
- ✅ Edge case handling

---

## 🎯 Hướng Dẫn Sử Dụng

### 1. Import vào Database
```bash
cd server
npx ts-node scripts/seed-python-challenges.ts
```

### 2. Test Solutions Locally
```python
# Tạo file test_solutions.py
def test_all():
    # Copy các test cases từ file này
    # Chạy với pytest hoặc unittest
    pass

if __name__ == '__main__':
    test_all()
```

### 3. Submit trên Platform
1. Đăng nhập vào BugHunter
2. Vào trang Practice
3. Chọn bài tập Python
4. Copy code chuẩn từ file này
5. Submit và kiểm tra kết quả

---

## 📚 Tài Liệu Tham Khảo

- [Python Official Documentation](https://docs.python.org/3/)
- [LeetCode Python Solutions](https://leetcode.com/problemset/all/)
- [Python Algorithm Patterns](https://github.com/TheAlgorithms/Python)
- [Big O Cheat Sheet](https://www.bigocheatsheet.com/)

---

**Tạo bởi:** BugHunter Team  
**Ngày:** 2025-12-05  
**Phiên bản:** 1.0.0