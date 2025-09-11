// Simple numeric sequence generator based on max(id) + 1
// Ensures compatibility with existing numeric id usage in the frontend
export async function getNextId(Model: any): Promise<number> {
  const doc = await Model.findOne({}, { id: 1 }).sort({ id: -1 }).lean()
  const currentMax = doc?.id || 0
  return currentMax + 1
}


