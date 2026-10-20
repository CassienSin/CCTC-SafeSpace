// Labels transcribed/summarized from the supplied CCTC handbook, pp. 32–35.
// A selected category describes an allegation, not a finding of guilt.
export const handbookCategories = [
  ['physical_emotional_harm', 'Physical or emotional harm'],
  ['public_display_of_affection', 'Public display of affection (PDA)'],
  ['verbal_abuse', 'Verbal abuse'],
  ['unauthorized_weapons', 'Unauthorized possession of deadly weapons'],
  ['substances_on_campus', 'Drugs, alcohol, or controlled substances on campus'],
  ['plagiarism', 'Plagiarism'],
  ['falsification', 'Falsification of school documents'],
  ['theft', 'Theft or stealing'],
  ['malicious_mischief', 'Intentional damage to another person’s property'],
  ['gambling', 'Gambling'],
  ['prohibited_organizations', 'Prohibited organizations'],
  ['disrespect_disobedience', 'Disrespect, disobedience, or defiance of school authorities'],
  ['arson', 'Arson'],
  ['sexual_assault_harassment', 'Sexual assault, rape, or sexual harassment'],
  ['bullying', 'Bullying'],
  ['cyberbullying', 'Cyberbullying'],
  ['malversation', 'Misuse of organization funds'],
  ['hazing', 'Hazing'],
  ['safety_rule_violation', 'Failure to comply with school safety rules'],
  ['threat_coercion', 'Threats, coercion, harassment, blackmail, or assault'],
  ['illicit_relationships', 'Illicit relationships / prostitution (handbook wording)'],
  ['handbook_anti_life', '“Anti-life practices” (handbook wording; requires sensitive review)'],
  ['bomb_threat', 'Bomb threat'],
  ['unauthorized_class_disruption', 'Unauthorized activities disrupting classes'],
  ['intoxication_on_campus', 'Entering campus under the influence of alcohol or drugs'],
  ['cheating', 'Cheating'],
  ['data_privacy', 'Data privacy concern'],
  ['school_property_damage', 'Damage to school property'],
  ['smoking_vaping', 'Smoking or vaping'],
  ['malicious_gossip', 'Malicious gossip or intrigues'],
  ['vandalism', 'Vandalism'],
  ['libel_cyberlibel', 'Libel or cyberlibel'],
  ['dishonesty', 'Dishonesty'],
  ['self_harm', 'Safety / wellbeing concern — not an offense classification'],
  ['other', 'Other / Not sure'],
].map(([value, label]) => ({ value, label }))

const legacyLabels = {
  harassment: 'Harassment', threat: 'Threat', violence: 'Violence',
  discrimination: 'Discrimination',
}

export function categoryLabel(value) {
  return handbookCategories.find((item) => item.value === value)?.label
    || legacyLabels[value] || value?.replaceAll('_', ' ') || 'Not provided'
}

export const classificationOptions = [
  { value: 'pending', label: 'Pending assessment' },
  { value: 'minor', label: 'Minor offense classification' },
  { value: 'major', label: 'Major offense classification' },
  { value: 'not_applicable', label: 'Not an offense / support concern' },
]

export function classificationLabel(value) {
  return classificationOptions.find((item) => item.value === value)?.label
    || 'Pending assessment'
}
