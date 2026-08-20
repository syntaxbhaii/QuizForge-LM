import io
from typing import Any, Dict, List, Tuple
import pandas as pd
from app.schemas.question import OptionCreate, QuestionCreate


def generate_questions_template_csv() -> bytes:
    """
    Generates a sample CSV template for questions upload.
    """
    df = pd.DataFrame([
        {
            "question_text": "What is the capital of France?",
            "question_type": "single",
            "points": 1.0,
            "explanation": "Paris is the capital and most populous city of France.",
            "option_1": "London",
            "option_1_correct": "false",
            "option_2": "Berlin",
            "option_2_correct": "false",
            "option_3": "Paris",
            "option_3_correct": "true",
            "option_4": "Rome",
            "option_4_correct": "false",
            "option_5": "",
            "option_5_correct": "false"
        },
        {
            "question_text": "Select all prime numbers.",
            "question_type": "multiple",
            "points": 2.0,
            "explanation": "2 and 3 are prime, while 4 is not.",
            "option_1": "2",
            "option_1_correct": "true",
            "option_2": "3",
            "option_2_correct": "true",
            "option_3": "4",
            "option_3_correct": "false",
            "option_4": "9",
            "option_4_correct": "false",
            "option_5": "",
            "option_5_correct": "false"
        },
        {
            "question_text": "The Earth is flat.",
            "question_type": "boolean",
            "points": 1.0,
            "explanation": "The Earth is an oblate spheroid.",
            "option_1": "True",
            "option_1_correct": "false",
            "option_2": "False",
            "option_2_correct": "true",
            "option_3": "",
            "option_3_correct": "false",
            "option_4": "",
            "option_4_correct": "false",
            "option_5": "",
            "option_5_correct": "false"
        }
    ])
    
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    csv_bytes = buffer.getvalue()
    buffer.close()
    return csv_bytes


def parse_questions_file(file_content: bytes, filename: str) -> Tuple[List[QuestionCreate], List[str]]:
    """
    Parses questions and options from CSV or Excel bytes.
    Returns: (list of QuestionCreate schemas, list of error messages)
    """
    errors = []
    questions_to_create = []
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            return [], ["Unsupported file format. Please upload CSV or Excel files."]
    except Exception as e:
        return [], [f"Failed to read file: {str(e)}"]

    # Fill NaNs with empty string
    df = df.fillna("")
    
    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed, header is row 1
        
        question_text = str(row.get("question_text", "")).strip()
        question_type = str(row.get("question_type", "single")).strip().lower()
        points_val = row.get("points", 1.0)
        explanation = str(row.get("explanation", "")).strip()
        
        if not question_text:
            errors.append(f"Row {row_num}: Missing 'question_text'.")
            continue
            
        if question_type not in ["single", "multiple", "boolean"]:
            errors.append(f"Row {row_num}: Invalid 'question_type'. Must be 'single', 'multiple', or 'boolean'.")
            continue
            
        try:
            points = float(points_val)
        except ValueError:
            points = 1.0
            errors.append(f"Row {row_num}: Invalid 'points' value, defaulted to 1.0.")
            
        # Parse options
        options_list = []
        for i in range(1, 6):
            opt_text = str(row.get(f"option_{i}", "")).strip()
            opt_corr_raw = str(row.get(f"option_{i}_correct", "false")).strip().lower()
            
            if opt_text:
                is_correct = opt_corr_raw in ["true", "1", "yes"]
                options_list.append(OptionCreate(option_text=opt_text, is_correct=is_correct))
                
        if len(options_list) < 2:
            errors.append(f"Row {row_num}: Question must have at least 2 options (found {len(options_list)}).")
            continue
            
        # Ensure at least one correct option
        has_correct = any(opt.is_correct for opt in options_list)
        if not has_correct:
            errors.append(f"Row {row_num}: Question must have at least one correct option.")
            continue
            
        # For single/boolean, ensure EXACTLY one correct option
        if question_type in ["single", "boolean"]:
            correct_count = sum(1 for opt in options_list if opt.is_correct)
            if correct_count != 1:
                errors.append(f"Row {row_num}: Single-choice/boolean question must have exactly one correct option.")
                continue

        questions_to_create.append(QuestionCreate(
            question_text=question_text,
            question_type=question_type,
            points=points,
            explanation=explanation if explanation else None,
            options=options_list
        ))
        
    return questions_to_create, errors
