import axios from 'axios';

const API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
const API_KEY = process.env.REACT_APP_HUGGING_FACE_API_KEY;

async function analyseFeedback(feedback) {
  try {
     // Define weights for labels
    const labelWeights = {
      'constructive criticism': 0.8,
      'feature request': 0.3,
      'suggestion for improvement': 0.8,
      'detailed feedback': 1.0,
      'bug report': 0.2,
      'general praise': 0.2,
    };

    const constructiveThreshold = 0.5; // Threshold for considering a label as sufficiently present
    const suggestionsMap = {
      'constructive criticism': 'Try to explain what could be improved and why.',
      'feature request': 'Mention any specific features you think are missing or could be added.',
      'suggestion for improvement': 'Provide suggestions on how things could be improved.',
      'detailed feedback': 'Include more details in your feedback.',
      'bug report': 'If you are reporting a bug, please provide a clear and concise description of the issue.',
      'general praise': 'If you are praising the project, please provide specific examples or praise points.',
    };

    // Using Zero-shot classification model to determine if feedback is constructive
    const zeroShotResponse = await axios.post(API_URL, {
      inputs: feedback,
      parameters: { candidate_labels: Object.keys(labelWeights) }
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    //consolelog for debugging
    console.log("Zero-shot response:", zeroShotResponse.data);

    const scores = zeroShotResponse.data.scores;
    const labels = zeroShotResponse.data.labels;
    let constructiveScore = 0;
    let feedbackSuggestions = [];

    labels.forEach((label, index) => {
      const weight = labelWeights[label] || 0;
      const score = scores[index];
      constructiveScore += score * weight;
      console.log(`Label: ${label}, Score: ${score}, Weight: ${weight}, Weighted Score: ${score * weight}`);
      
      if (score < constructiveThreshold) {
        feedbackSuggestions.push(suggestionsMap[label]);
      }
    });

    console.log(`Total Constructive Score: ${constructiveScore}, Threshold: ${constructiveThreshold}`);

    const isConstructive = constructiveScore >= constructiveThreshold;
    console.log(`Is Constructive: ${isConstructive}`);

    return {
      isConstructive: isConstructive ? 'yes' : 'no',
      suggestions: feedbackSuggestions, // Return suggestions for improvement
    };
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    return { isConstructive: 'no', suggestions: [] }; // Fallback
  }
}

export default analyseFeedback;