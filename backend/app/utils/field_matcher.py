"""
Field matching utilities for improved label-to-input mapping
"""
from typing import Dict, Any, Optional, List
import re
from difflib import SequenceMatcher


class FieldMatcher:
    """Utility class for matching form fields to labels"""
    
    @staticmethod
    def similarity(a: str, b: str) -> float:
        """
        Calculate similarity between two strings
        
        Args:
            a: First string
            b: Second string
        
        Returns:
            Similarity score between 0 and 1
        """
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()
    
    @staticmethod
    def normalize_label(label: str) -> str:
        """
        Normalize label text for matching
        
        Args:
            label: Label text
        
        Returns:
            Normalized label
        """
        label = label.strip()
        label = re.sub(r'[^\w\s]', '', label)
        label = re.sub(r'\s+', ' ', label)
        return label.lower()
    
    @staticmethod
    def find_best_match(target: str, candidates: List[str], threshold: float = 0.6) -> Optional[str]:
        """
        Find best matching candidate for target string
        
        Args:
            target: Target string to match
            candidates: List of candidate strings
            threshold: Minimum similarity threshold
        
        Returns:
            Best matching candidate or None
        """
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
        """
        Match form data keys to available form fields
        
        Args:
            form_data: Data to fill (keys are user-provided labels)
            available_fields: List of detected form fields
        
        Returns:
            Matched form data dictionary
        """
        matched_data = {}
        field_labels = [field['label'] for field in available_fields]
        
        for user_key, value in form_data.items():
            matched_label = FieldMatcher.find_best_match(user_key, field_labels)
            if matched_label:
                matched_data[matched_label] = value
            else:
                matched_data[user_key] = value
        
        return matched_data

