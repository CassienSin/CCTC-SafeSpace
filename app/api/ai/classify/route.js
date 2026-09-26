import incidentModel from '../../../../ai/model/incident_model.json'
import severityModel from '../../../../ai/model/severity_model.json'

function tokenize(text) {
  return text
    .toLowerCase()
    .match(/[\p{L}\p{N}_]{2,}/gu) || []
}

function generateFeatures(text, model) {
  const tokens = tokenize(text)
  const features = []

  // Unigrams
  for (const token of tokens) {
    features.push(token)
  }

  // Bigrams
  for (let i = 0; i < tokens.length - 1; i++) {
    features.push(`${tokens[i]} ${tokens[i + 1]}`)
  }

  return features
}

function vectorize(text, model) {
  const features = generateFeatures(text, model)

  const vocabulary = model.vocabulary
  const idf = model.idf

  const vector = new Array(idf.length).fill(0)
  const counts = {}

  for (const feature of features) {
    const index = vocabulary[feature]

    if (index !== undefined) {
      counts[index] = (counts[index] || 0) + 1
    }
  }

  for (const [indexString, count] of Object.entries(counts)) {
    const index = Number(indexString)

    let tf = count

    if (model.sublinear_tf) {
      tf = 1 + Math.log(count)
    }

    vector[index] = tf * idf[index]
  }

  // L2 normalization
  let norm = 0

  for (const value of vector) {
    norm += value * value
  }

  norm = Math.sqrt(norm)

  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm
    }
  }

  return vector
}

function predict(model, text) {
  const vector = vectorize(text, model)

  const classes = model.classes
  const coefficients = model.coef
  const intercept = model.intercept

  const scores = []

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    let score = intercept[classIndex] || 0

    const weights = coefficients[classIndex]

    for (let i = 0; i < vector.length; i++) {
      if (vector[i] !== 0 && weights[i] !== undefined) {
        score += vector[i] * weights[i]
      }
    }

    scores.push(score)
  }

  // Softmax
  const maxScore = Math.max(...scores)

  const exponentials = scores.map((score) =>
    Math.exp(score - maxScore)
  )

  const total = exponentials.reduce(
    (sum, value) => sum + value,
    0
  )

  const probabilities = exponentials.map(
    (value) => value / total
  )

  let bestIndex = 0

  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[bestIndex]) {
      bestIndex = i
    }
  }

  return {
    prediction: classes[bestIndex],
    probability: probabilities[bestIndex],
    probabilities,
  }
}

export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.text || typeof body.text !== 'string') {
      return Response.json(
        {
          error: 'Report text is required.',
        },
        {
          status: 400,
        }
      )
    }

    const text = body.text.trim()

    if (!text) {
      return Response.json(
        {
          error: 'Report text is required.',
        },
        {
          status: 400,
        }
      )
    }

    // Run the custom CCTC incident classifier
    const categoryResult = predict(
      incidentModel,
      text
    )

    // Run the custom CCTC severity classifier
    const severityResult = predict(
      severityModel,
      text
    )

    const category =
      categoryResult.prediction

    const severity =
      severityResult.prediction

    /*
     * High-risk categories always require human review.
     * High and critical severity also require human review.
     */
    const highRiskCategories = [
      'self_harm',
      'threat',
      'violence',
    ]

    const requiresHumanReview =
      highRiskCategories.includes(category) ||
      severity === 'high' ||
      severity === 'critical'

    return Response.json({
      category,
      category_probability:
        categoryResult.probability,

      severity,
      severity_probability:
        severityResult.probability,

      requires_human_review:
        requiresHumanReview,
    })
  } catch (error) {
    console.error(
      'AI classification error:',
      error
    )

    return Response.json(
      {
        error:
          'AI classification failed.',
      },
      {
        status: 500,
      }
    )
  }
}