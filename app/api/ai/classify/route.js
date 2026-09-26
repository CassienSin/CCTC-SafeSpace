export async function POST(request) {
  try {
    const body = await request.json()

    if (!body.text || typeof body.text !== 'string') {
      return Response.json(
        { error: 'Report text is required.' },
        { status: 400 }
      )
    }

    const response = await fetch(
      'http://127.0.0.1:8000/predict-all',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: body.text,
        }),
        cache: 'no-store',
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return Response.json(
        {
          error:
            data.detail ||
            'AI classification failed.',
        },
        { status: response.status }
      )
    }

    return Response.json(data)
  } catch (error) {
    console.error(
      'AI classification error:',
      error
    )

    return Response.json(
      {
        error:
          'Unable to connect to the AI classification service.',
      },
      { status: 500 }
    )
  }
}