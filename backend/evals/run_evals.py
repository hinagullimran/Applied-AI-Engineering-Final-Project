import asyncio
import json
import os
import sys
from typing import List, Dict, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.manager import CatalystManager
from app.core.config import settings
import google.generativeai as genai

class EvalEngine:
    def __init__(self):
        self.manager = CatalystManager()
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.grader_model = genai.GenerativeModel('gemini-pro')

    async def grade_output(self, output: Dict[str, Any], ground_truth: Dict[str, Any]) -> float:
        """Uses LLM as a judge to score the agent's output against ground truth."""
        prompt = f"""
        Rate the accuracy of an AI market intelligence agent.
        
        Category: {ground_truth['category']}
        Ground Truth Gaps: {ground_truth['expected_gaps']}
        Ground Truth Opportunity: {ground_truth['ground_truth_opportunity']}
        
        Agent Output:
        {json.dumps(output.get('analysis', {}), indent=2)}
        
        Score the output from 0 to 100 based on:
        1. Relevance to ground truth gaps (40 points)
        2. Innovation of the suggested opportunity (30 points)
        3. Structural correctness of JSON (30 points)
        
        Return ONLY the numeric score.
        """
        try:
            response = self.grader_model.generate_content(prompt)
            score = float(response.text.strip())
            return score
        except:
            return 0.0

    async def run(self):
        print("🚀 Starting Catalyst Evaluation Pipeline...")
        
        with open("evals/data/ground_truth.json", "r") as f:
            test_cases = json.load(f)
            
        results = []
        for case in test_cases:
            print(f"Testing Category: {case['category']}...")
            # Run the manager (skipping client_id for eval)
            output = await self.manager.discover_opportunity(case['category'])
            
            score = await self.grade_output(output, case)
            results.append({
                "category": case['category'],
                "score": score,
                "status": "PASS" if score > 70 else "FAIL"
            })
            print(f"Result: {score}/100")

        # Final Report
        avg_score = sum(r['score'] for r in results) / len(results)
        print("\n" + "="*30)
        print(f"Final Eval Accuracy: {avg_score:.2f}%")
        print("="*30)
        
        with open("evals/results.json", "w") as f:
            json.dump(results, f, indent=2)

if __name__ == "__main__":
    engine = EvalEngine()
    asyncio.run(engine.run())
