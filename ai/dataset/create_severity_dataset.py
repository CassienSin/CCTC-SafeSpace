from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "severity.csv"

examples = {
    "low": [
        "A student made a joke about me during class and it made me uncomfortable.",
        "Someone teased me once during lunch.",
        "A classmate made an inappropriate comment toward me.",
        "A student excluded me from a group activity.",
        "Someone made fun of my answer during class.",
        "A classmate called me a rude name once.",
        "Someone posted a mildly embarrassing comment about me.",
        "A student ignored me during a group activity.",
        "A classmate made a joke about my appearance.",
        "Someone made an uncomfortable remark toward me.",
        "A student laughed at me when I made a mistake.",
        "Someone made a disrespectful comment during class.",
        "A classmate made fun of my clothes.",
        "Someone left me out of a classroom activity.",
        "A student sent me an unpleasant message.",
        "A classmate made a joke about my accent.",
        "Someone said something offensive to me once.",
        "A student made a rude comment in front of classmates.",
        "Someone mocked my answer during a discussion.",
        "A classmate made me uncomfortable with a joke.",
        "Someone made a sarcastic comment about me.",
        "A student laughed when I was speaking.",
        "A classmate made an inappropriate joke toward me.",
        "Someone made fun of my handwriting.",
        "A student made a rude gesture toward me.",
        "A classmate excluded me from a conversation.",
        "Someone made a comment that embarrassed me.",
        "A student teased me about my school work.",
        "Someone made an unpleasant remark online.",
        "A classmate joked about my interests.",
        "Someone made a disrespectful comment during lunch.",
        "A student laughed at me for asking a question.",
        "A classmate made a joke about my hairstyle.",
        "Someone made me uncomfortable during a conversation.",
        "A student made a rude comment about my project.",
        "A classmate made fun of something I said.",
        "Someone posted an unkind comment about me.",
        "A student ignored me when I asked for help.",
        "A classmate made an embarrassing joke about me.",
        "Someone teased me about a mistake I made.",
        "A student made a disrespectful joke during class.",
    ],

    "medium": [
        "A group of students has been repeatedly making fun of me.",
        "A classmate has been sending insulting messages several times.",
        "Students regularly exclude me from group activities.",
        "Someone has been repeatedly spreading rumors about me.",
        "A student keeps making humiliating comments toward me.",
        "I have been bullied several times during lunch.",
        "A group of students repeatedly mocks me in class.",
        "Someone keeps posting embarrassing things about me online.",
        "A classmate repeatedly calls me insulting names.",
        "Students have been intentionally excluding me for several weeks.",
        "A student keeps threatening to embarrass me in front of others.",
        "Someone repeatedly sends me unwanted messages.",
        "A group of classmates keeps laughing at me every day.",
        "A student has been targeting me with repeated insults.",
        "I keep getting mocked by the same group of students.",
        "Someone has repeatedly shared private information about me.",
        "Students repeatedly make jokes about my appearance.",
        "A classmate keeps posting negative comments about me.",
        "I have been repeatedly excluded from activities.",
        "A student keeps making inappropriate comments toward me.",
        "A group has been repeatedly calling me offensive names.",
        "Someone has been repeatedly harassing me online.",
        "Students keep making fun of me whenever I participate.",
        "A classmate repeatedly sends me rude messages.",
        "Someone has been spreading rumors about me for several days.",
        "A student repeatedly embarrasses me in front of others.",
        "The same students keep bothering me between classes.",
        "I have been receiving repeated insulting messages.",
        "A group of students keeps targeting me during school.",
        "Someone repeatedly posts mean comments about me.",
        "A classmate keeps making jokes about my personal life.",
        "Students repeatedly leave me out on purpose.",
        "Someone keeps mocking me whenever they see me.",
        "I have been repeatedly insulted by another student.",
        "A student keeps making offensive remarks toward me.",
        "The bullying has been happening regularly for weeks.",
        "Someone repeatedly sends hurtful messages to me.",
        "Students keep making humiliating jokes about me.",
        "A classmate has repeatedly tried to embarrass me.",
        "The same group keeps bothering me every day.",
    ],

    "high": [
        "A student threatened to hurt me after school.",
        "Someone threatened to beat me if I reported them.",
        "A classmate told me they were going to attack me.",
        "A student has been following me and threatening me.",
        "Someone threatened me with physical violence.",
        "A student pushed me and said they would hurt me again.",
        "A classmate threatened to bring someone to hurt me.",
        "Someone cornered me and threatened me.",
        "A student threatened to attack me tomorrow.",
        "Someone sent me a message threatening physical harm.",
        "A student has repeatedly threatened me after class.",
        "A classmate threatened me while holding an object.",
        "Someone told me they would hurt my family.",
        "A student threatened to find me after school.",
        "Someone has been waiting outside my classroom and threatening me.",
        "A student shoved me during an argument and threatened me afterward.",
        "A classmate threatened me if I told a teacher.",
        "Someone threatened to seriously hurt me.",
        "A student has been intimidating me with threats of violence.",
        "A classmate threatened me through messages.",
        "Someone followed me home and threatened me.",
        "A student said they would attack me if they saw me again.",
        "Someone threatened me during a confrontation.",
        "A student made a direct threat against me.",
        "A classmate threatened to physically harm me.",
        "Someone threatened me because I reported their behavior.",
        "A student threatened to hurt another student.",
        "Someone has been making repeated threats against me.",
        "A classmate threatened me in the hallway.",
        "A student threatened violence during an argument.",
        "Someone threatened to assault me after school.",
        "A student has been aggressively confronting me and making threats.",
        "A classmate threatened to hurt me if I refused to help them.",
        "Someone sent a threatening message saying they would attack me.",
        "A student threatened me while several other students watched.",
        "Someone threatened to physically harm my friend.",
        "A classmate made a serious threat against another student.",
        "A student threatened violence toward me online.",
        "Someone has been waiting for me and making threats.",
        "A student directly threatened to attack me.",
    ],

    "critical": [
        "Someone is attacking me right now and I cannot get away.",
        "A student is physically attacking another student right now.",
        "Someone has a weapon and is threatening students.",
        "A student is seriously injured after being attacked.",
        "Someone is threatening to kill a student right now.",
        "A person is actively attacking people in the school.",
        "A student has been seriously hurt and needs immediate help.",
        "Someone is holding a weapon and threatening people.",
        "A student is unconscious after a violent incident.",
        "Someone is actively trying to seriously harm another student.",
        "A violent fight is happening right now and someone is badly injured.",
        "Someone is threatening immediate serious harm to students.",
        "A student is bleeding heavily after being attacked.",
        "A person is attacking students and has a weapon.",
        "Someone is attempting to seriously injure another student right now.",
        "A student is in immediate danger from an ongoing attack.",
        "There is an active violent incident happening at school.",
        "Someone is seriously hurting a student right now.",
        "A student has been attacked and appears seriously injured.",
        "Someone is threatening immediate deadly violence.",
        "A person with a weapon is currently threatening students.",
        "A student is being violently attacked right now.",
        "Someone is actively assaulting a student.",
        "A student needs immediate emergency assistance after an attack.",
        "Someone is currently threatening to kill someone at school.",
        "There is an ongoing physical attack in the classroom.",
        "A student has suffered serious injuries during a fight.",
        "Someone is actively attempting to harm students.",
        "A person is currently attacking someone with a weapon.",
        "A student is in immediate danger from a violent person.",
        "There is an active threat involving a weapon.",
        "Someone is currently seriously injuring another person.",
        "A violent attack is happening right now.",
        "A student is seriously injured and needs emergency medical attention.",
        "Someone is actively threatening people with a weapon.",
        "A student is being attacked and cannot escape.",
        "There is an immediate danger to students from an ongoing attack.",
        "Someone is attempting to cause serious physical harm right now.",
        "A student has been badly injured during an active violent incident.",
        "An armed person is currently threatening people at school.",
    ],
}

rows = []

for severity, texts in examples.items():
    for text in texts:
        rows.append({
            "text": text,
            "severity": severity,
        })

df = pd.DataFrame(rows)

df = df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("=" * 60)
print("SEVERITY DATASET CREATED")
print("=" * 60)

print(f"\nTotal examples: {len(df)}")

print("\nDistribution:")
print(
    df["severity"]
    .value_counts()
    .sort_index()
)

print(f"\nSaved to:")
print(OUTPUT_PATH)

print("\nDone!")