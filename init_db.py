from app import app, db, Problem, TestCase

def init_db():
    with app.app_context():
        # Create all tables
        db.drop_all()  # Drop existing tables
        db.create_all()
        
        # Add some sample problems
        sample_problems = [
            {
                'title': 'Two Sum',
                'description': '''Given an array of integers nums and an integer target, return indices of the two numbers in nums such that they add up to target.
                You may assume that each input would have exactly one solution, and you may not use the same element twice.
                You can return the answer in any order.''',
                'difficulty': 'Easy',
                'category': 'Arrays & Hashing',
                'initial_code': '''def two_sum(nums, target):
    # Write your code here
    pass''',
                'solution': '''def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []''',
            },
            {
                'title': 'Valid Parentheses',
                'description': '''Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.
                An input string is valid if:
                1. Open brackets must be closed by the same type of brackets.
                2. Open brackets must be closed in the correct order.
                3. Every close bracket has a corresponding open bracket of the same type.''',
                'difficulty': 'Easy',
                'category': 'Stack',
                'initial_code': '''def is_valid(s):
    # Write your code here
    pass''',
                'solution': '''def is_valid(s):
    stack = []
    brackets = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in brackets.values():
            stack.append(char)
        elif char in brackets:
            if not stack or stack.pop() != brackets[char]:
                return False
    return len(stack) == 0''',
            }
        ]

        # Add problems to database
        for problem_data in sample_problems:
            problem = Problem(**problem_data)
            db.session.add(problem)
            db.session.flush()  # Flush to get the problem ID
            
            # Add test cases for Two Sum
            if problem.title == 'Two Sum':
                test_cases = [
                    {
                        'input_data': '[2,7,11,15], 9',
                        'expected_output': '[0,1]',
                        'is_hidden': False
                    },
                    {
                        'input_data': '[3,2,4], 6',
                        'expected_output': '[1,2]',
                        'is_hidden': False
                    },
                    {
                        'input_data': '[3,3], 6',
                        'expected_output': '[0,1]',
                        'is_hidden': True
                    }
                ]
                for tc in test_cases:
                    test_case = TestCase(problem_id=problem.id, **tc)
                    db.session.add(test_case)
            
            # Add test cases for Valid Parentheses
            elif problem.title == 'Valid Parentheses':
                test_cases = [
                    {
                        'input_data': '()',
                        'expected_output': 'True',
                        'is_hidden': False
                    },
                    {
                        'input_data': '()[]{}',
                        'expected_output': 'True',
                        'is_hidden': False
                    },
                    {
                        'input_data': '(]',
                        'expected_output': 'False',
                        'is_hidden': False
                    },
                    {
                        'input_data': '([)]',
                        'expected_output': 'False',
                        'is_hidden': True
                    }
                ]
                for tc in test_cases:
                    test_case = TestCase(problem_id=problem.id, **tc)
                    db.session.add(test_case)

        db.session.commit()

if __name__ == '__main__':
    init_db()
