// The legacy model's category/severity labels do not implement the handbook.
// Keep training assets for reference; do not present them as offense decisions.
export async function POST() {
  return Response.json({
    error: 'Automatic severity classification has been retired. Reload the report form and choose an incident category for human assessment.',
    code: 'HANDBOOK_ASSESSMENT_REQUIRED',
  }, { status: 410 })
}
