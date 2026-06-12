const topicsData = {
    'arrays': {
        title: 'Top Array Interview Questions - Structured Path',
        subtitle: 'Given below is the best-structured path to learn Arrays with the best video tutorials, and practice problems asked in top tech giants.',
        totalQuestions: 15,
        stats: { easy: 5, med: 6, hard: 4 },
        difficulties: {
            'Basic': [
                { name: 'Largest Element in Array', diff: 'Easy', link: '#', vid: true, doc: true, prac: false },
                { name: 'Linear Search', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Two Sum', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Remove Duplicates from Sorted Array', diff: 'Easy', link: '#', vid: true, doc: false, prac: true },
                { name: 'Best Time to Buy and Sell Stock', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Medium': [
                { name: '3Sum', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Container With Most Water', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Product of Array Except Self', diff: 'Medium', link: '#', vid: false, doc: true, prac: true },
                { name: 'Maximum Subarray', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find Minimum in Rotated Sorted Array', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Search in Rotated Sorted Array', diff: 'Medium', link: '#', vid: true, doc: false, prac: true }
            ],
            'Hard': [
                { name: 'Trapping Rain Water', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'First Missing Positive', diff: 'Hard', link: '#', vid: false, doc: true, prac: true },
                { name: 'Largest Rectangle in Histogram', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Median of Two Sorted Arrays', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'two-pointers': {
        title: 'Two Pointers Interview Questions',
        subtitle: 'Master the Two Pointers technique to solve array and string problems with O(n) or O(n log n) time complexity dynamically.',
        totalQuestions: 14,
        stats: { easy: 6, med: 6, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Reverse String', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Move Zeroes', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Valid Palindrome', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Squares of a Sorted Array', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Merge Sorted Array', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Remove Element', diff: 'Easy', link: '#', vid: false, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Two Sum II - Input Array Is Sorted', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: '3Sum', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Container With Most Water', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Sort Colors', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: '4Sum', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Valid Palindrome II', diff: 'Medium', link: '#', vid: false, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Trapping Rain Water', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Minimum Window Substring', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'sliding-window': {
        title: 'Sliding Window Interview Questions',
        subtitle: 'Optimize array operations by maintaining a window of values, a crucial pattern for substring problems.',
        totalQuestions: 12,
        stats: { easy: 3, med: 7, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Maximum Average Subarray I', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Best Time to Buy and Sell Stock', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Contains Duplicate II', diff: 'Easy', link: '#', vid: false, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Longest Substring Without Repeating Characters', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Longest Repeating Character Replacement', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Permutation in String', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find All Anagrams in a String', diff: 'Medium', link: '#', vid: true, doc: false, prac: true },
                { name: 'Maximum Number of Vowels in a Substring', diff: 'Medium', link: '#', vid: false, doc: true, prac: true },
                { name: 'Fruit Into Baskets', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Max Consecutive Ones III', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Minimum Window Substring', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Sliding Window Maximum', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'stack': {
        title: 'Stack Interview Questions',
        subtitle: 'Learn to use LIFO (Last In First Out) structures to solve a variety of algorithmic parsing and interval problems.',
        totalQuestions: 12,
        stats: { easy: 3, med: 7, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Implement Stack using Arrays', diff: 'Easy', link: '#', vid: false, doc: true, prac: false }
            ],
            'Easy': [
                { name: 'Valid Parentheses', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Min Stack', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Evaluate Reverse Polish Notation', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Generate Parentheses', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Daily Temperatures', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Car Fleet', diff: 'Medium', link: '#', vid: true, doc: false, prac: true },
                { name: 'Asteroid Collision', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Remove K Digits', diff: 'Medium', link: '#', vid: false, doc: true, prac: true },
                { name: 'Online Stock Span', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Largest Rectangle in Histogram', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Maximal Rectangle', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'binary-search': {
        title: 'Binary Search Interview Questions',
        subtitle: 'Master O(log n) optimization. Dive deep into finding elements, ranges, and thresholds in sorted spaces.',
        totalQuestions: 13,
        stats: { easy: 3, med: 7, hard: 3 },
        difficulties: {
            'Basic': [
                { name: 'Binary Search Implementation', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Search Insert Position', diff: 'Easy', link: '#', vid: false, doc: true, prac: true },
                { name: 'Guess Number Higher or Lower', diff: 'Easy', link: '#', vid: false, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Search a 2D Matrix', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find Minimum in Rotated Sorted Array', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Search in Rotated Sorted Array', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Time Based Key-Value Store', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Koko Eating Bananas', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find First and Last Position of Element in Sorted Array', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Capacity To Ship Packages Within D Days', diff: 'Medium', link: '#', vid: false, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Median of Two Sorted Arrays', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Split Array Largest Sum', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find in Mountain Array', diff: 'Hard', link: '#', vid: false, doc: true, prac: true }
            ]
        }
    },
    'linked-list': {
        title: 'Linked List Interview Questions',
        subtitle: 'Understand pointers and node structures. Traverse, mutate, and evaluate singly and doubly linked networks.',
        totalQuestions: 10,
        stats: { easy: 4, med: 4, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Print Linked List', diff: 'Easy', link: '#', vid: false, doc: true, prac: false }
            ],
            'Easy': [
                { name: 'Reverse Linked List', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Merge Two Sorted Lists', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Linked List Cycle', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Reorder List', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Remove Nth Node From End of List', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Copy List with Random Pointer', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Add Two Numbers', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Merge k Sorted Lists', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Reverse Nodes in k-Group', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'trees-dfs': {
        title: 'Trees (DFS) Interview Questions',
        subtitle: 'Dive deep recursively into hierarchical data. Master Pre-order, In-order, and Post-order depth-first traversals.',
        totalQuestions: 12,
        stats: { easy: 4, med: 6, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Inorder Traversal', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Maximum Depth of Binary Tree', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Diameter of Binary Tree', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'Same Tree', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Lowest Common Ancestor of a Binary Search Tree', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Kth Smallest Element in a BST', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Construct Binary Tree from Preorder and Inorder Traversal', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Validate Binary Search Tree', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Count Good Nodes in Binary Tree', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Path Sum', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Binary Tree Maximum Path Sum', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Serialize and Deserialize Binary Tree', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    },
    'trees-bfs': {
        title: 'Trees (BFS) Interview Questions',
        subtitle: 'Explore hierarchical structures level-by-level safely and reliably using Queue-driven breadth-first processing.',
        totalQuestions: 8,
        stats: { easy: 2, med: 4, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'Level Order Traversal', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Average of Levels in Binary Tree', diff: 'Easy', link: '#', vid: false, doc: true, prac: true },
                { name: 'Symmetric Tree', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Binary Tree Right Side View', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Populating Next Right Pointers in Each Node', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Find Largest Value in Each Tree Row', diff: 'Medium', link: '#', vid: false, doc: true, prac: true },
                { name: 'Deepest Leaves Sum', diff: 'Medium', link: '#', vid: false, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Word Ladder', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Minimum Number of Operations to Sort a Binary Tree by Level', diff: 'Hard', link: '#', vid: false, doc: true, prac: true }
            ]
        }
    },
    'graphs': {
        title: 'Graphs Interview Questions',
        subtitle: 'Learn to track network connectivity, cycles, and shortest paths. Crucial for FAANG interviews.',
        totalQuestions: 13,
        stats: { easy: 3, med: 8, hard: 2 },
        difficulties: {
            'Basic': [
                { name: 'BFS of Graph', diff: 'Easy', link: '#', vid: true, doc: true, prac: true },
                { name: 'DFS of Graph', diff: 'Easy', link: '#', vid: true, doc: true, prac: true }
            ],
            'Easy': [
                { name: 'Find if Path Exists in Graph', diff: 'Easy', link: '#', vid: false, doc: true, prac: true },
                { name: 'Find Center of Star Graph', diff: 'Easy', link: '#', vid: false, doc: true, prac: true }
            ],
            'Medium': [
                { name: 'Number of Islands', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Max Area of Island', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Clone Graph', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Pacific Atlantic Water Flow', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Surrounded Regions', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Rotting Oranges', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Course Schedule', diff: 'Medium', link: '#', vid: true, doc: true, prac: true },
                { name: 'Redundant Connection', diff: 'Medium', link: '#', vid: true, doc: true, prac: true }
            ],
            'Hard': [
                { name: 'Word Ladder', diff: 'Hard', link: '#', vid: true, doc: true, prac: true },
                { name: 'Alien Dictionary', diff: 'Hard', link: '#', vid: true, doc: true, prac: true }
            ]
        }
    }
};
