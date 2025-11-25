from typing import Dict, Any, Optional, List
import re
from difflib import SequenceMatcher


class FieldMatcher:
    
    @staticmethod
    def similarity(a: str, b: str) -> float:
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    
    @staticmethod
    def normalize_label(label: str) -> str:
        label = label.strip()
        label = re.sub(r'[^\w\s]', '', label)
        label = re.sub(r'\s+', ' ', label)
        return label.lower()
    
    @staticmethod
    def find_best_match(target: str, candidates: List[str], threshold: float = 0.6) -> Optional[str]:
        if not candidates:
            return None
        
        target_norm = FieldMatcher.normalize_label(target)
        best_match = None
        best_score = 0.0
        
        for candidate in candidates:
            candidate_norm = FieldMatcher.normalize_label(candidate)
            score = FieldMatcher.similarity(target_norm, candidate_norm)
            
            if score > best_score and score >= threshold:
                best_score = score
                best_match = candidate
        
        return best_match
    
    @staticmethod
    def match_form_data_to_fields(form_data: Dict[str, Any], available_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        matched_data = {}
        field_labels = [field['label'] for field in available_fields]
        
        for user_key, value in form_data.items():
            matched_label = FieldMatcher.find_best_match(user_key, field_labels)
            if matched_label:
                matched_data[matched_label] = value
            else:
                matched_data[user_key] = value
        
        return matched_data

