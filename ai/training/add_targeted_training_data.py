from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"
TEST_PATH = BASE_DIR / "dataset" / "test.csv"


TARGET_PER_CATEGORY = 150
NEW_PER_CATEGORY = 50


# -------------------------------------------------------------------
# Targeted synthetic training examples
# -------------------------------------------------------------------

EXAMPLES = {
    "bullying": [
        "A group of students repeatedly mocks me during class.",
        "Several classmates keep making fun of the way I speak.",
        "Other students repeatedly laugh at me when I answer questions.",
        "A group of classmates keeps teasing me about my appearance.",
        "Some students regularly make jokes about me in front of others.",
        "Classmates repeatedly call me embarrassing names at school.",
        "A group of students keeps ridiculing me during lunch.",
        "Other students repeatedly make fun of my clothes.",
        "Several classmates laugh at me whenever I walk into the room.",
        "Students repeatedly tease me about my interests.",
        "A classmate keeps humiliating me in front of other students.",
        "Several students repeatedly make jokes about my family.",
        "Other students keep making fun of my academic performance.",
        "A group of classmates repeatedly mocks my accent.",
        "Students regularly tease me whenever I participate in class.",
        "A classmate repeatedly makes fun of my hairstyle.",
        "Several students keep laughing at me during school activities.",
        "Other students repeatedly ridicule me because of how I look.",
        "A group of classmates keeps teasing me during recess.",
        "Students repeatedly make embarrassing jokes about me.",
        "A classmate keeps mocking the way I walk.",
        "Several students repeatedly make fun of my hobbies.",
        "Other students keep teasing me whenever I speak.",
        "A group of classmates repeatedly laughs at my mistakes.",
        "Students keep making jokes about me during group work.",
        "A classmate repeatedly ridicules my appearance.",
        "Several classmates keep teasing me in the cafeteria.",
        "Other students repeatedly mock my answers in class.",
        "A group of students keeps making humiliating jokes about me.",
        "Students repeatedly tease me about my personal interests.",
        "A classmate keeps making fun of me around other students.",
        "Several students repeatedly mock my clothing.",
        "Other classmates keep laughing when I make a mistake.",
        "A group of students repeatedly teases me during school events.",
        "Students keep making jokes about my appearance.",
        "A classmate repeatedly mocks my voice.",
        "Several classmates keep ridiculing me during lunch.",
        "Other students repeatedly tease me about my grades.",
        "A group of classmates keeps laughing at me during activities.",
        "Students repeatedly make fun of my mannerisms.",
        "A classmate keeps teasing me whenever I enter the classroom.",
        "Several students repeatedly mock me in front of teachers.",
        "Other classmates keep making jokes about how I look.",
        "A group of students repeatedly teases me after class.",
        "Students keep ridiculing me whenever I participate.",
        "A classmate repeatedly makes embarrassing comments about me.",
        "Several students keep making fun of my interests.",
        "Other students repeatedly laugh at me during presentations.",
        "A group of classmates keeps mocking me at school.",
        "Students repeatedly tease me in front of my classmates.",
    ],

    "cyberbullying": [
        "A classmate repeatedly posts insulting comments about me online.",
        "Someone keeps sharing embarrassing posts about me on social media.",
        "Students repeatedly tag me in humiliating online content.",
        "A person keeps sending insulting messages through social media.",
        "Someone created posts making fun of me on the internet.",
        "A classmate repeatedly comments negatively on my photos.",
        "Students keep sharing embarrassing pictures of me online.",
        "Someone repeatedly mocks me in a group chat.",
        "A classmate keeps posting jokes about me online.",
        "Someone shares false and humiliating claims about me online.",
        "Students repeatedly mention me in insulting posts.",
        "A person keeps sending me hurtful messages through an online platform.",
        "Someone uploaded an embarrassing picture of me without permission.",
        "A classmate repeatedly makes fun of me in an online group.",
        "Students keep spreading embarrassing content about me online.",
        "Someone repeatedly leaves insulting comments on my posts.",
        "A person keeps creating posts that ridicule me.",
        "A classmate repeatedly sends humiliating messages in our group chat.",
        "Someone keeps sharing screenshots of private conversations to embarrass me.",
        "Students repeatedly make insulting comments about me online.",
        "A person keeps using social media to mock me.",
        "Someone repeatedly posts edited pictures intended to embarrass me.",
        "A classmate keeps making negative posts about me.",
        "Students share embarrassing information about me through messaging apps.",
        "Someone repeatedly mentions me in cruel online jokes.",
        "A person keeps posting hurtful comments under my pictures.",
        "A classmate repeatedly insults me in an online class group.",
        "Someone created an account to make fun of me.",
        "Students keep forwarding embarrassing messages about me.",
        "A person repeatedly posts rumors about me online.",
        "Someone keeps making insulting videos about me.",
        "A classmate repeatedly shares humiliating content about me.",
        "Students keep posting jokes about me without my permission.",
        "Someone repeatedly sends hostile messages through social media.",
        "A person keeps commenting negatively on everything I post.",
        "A classmate repeatedly shares embarrassing screenshots of me.",
        "Someone posts false accusations about me online.",
        "Students repeatedly ridicule me in a group chat.",
        "A person keeps uploading content that makes fun of me.",
        "Someone repeatedly uses an online group to embarrass me.",
        "A classmate keeps sending unwanted insulting messages online.",
        "Students repeatedly share posts designed to humiliate me.",
        "Someone keeps making cruel comments on my social media.",
        "A person repeatedly spreads embarrassing stories about me online.",
        "A classmate posts insulting jokes about me in a group.",
        "Someone repeatedly shares private information to embarrass me.",
        "Students keep making fun of me through messaging apps.",
        "A person repeatedly targets me with insulting online posts.",
        "Someone keeps posting humiliating comments about me.",
        "A classmate repeatedly mocks me through social media.",
    ],

    "discrimination": [
        "I was treated unfairly during a school activity because of my gender.",
        "A teacher excluded me from an opportunity because of my disability.",
        "I was treated differently because of my religion.",
        "A classmate refused to include me because of my ethnicity.",
        "I was denied participation because of my gender.",
        "Students treated me unfairly because of my nationality.",
        "I was excluded from a group because of my disability.",
        "A school activity was made unavailable to me because of my religion.",
        "Someone treated me differently because of my race.",
        "I was left out because of my cultural background.",
        "A classmate made decisions about me based on my disability.",
        "I was treated unfairly because I am a woman.",
        "Students excluded me because of my religious beliefs.",
        "I was denied an opportunity because of my ethnicity.",
        "A teacher treated me differently because of my nationality.",
        "I was excluded from an activity because of my gender.",
        "Someone refused to work with me because of my disability.",
        "I was treated differently because of my cultural background.",
        "A classmate excluded me because of my religion.",
        "I was denied access to an activity because of my disability.",
        "Students treated me unfairly because of my ethnicity.",
        "I was excluded from a school group because of my gender.",
        "A teacher refused to give me the same opportunity because of my race.",
        "I was treated differently because of my nationality.",
        "Someone excluded me because of my religious beliefs.",
        "I was treated unfairly because of my cultural identity.",
        "A classmate refused to include me because of my gender.",
        "I was denied participation because of my race.",
        "Students excluded me because of my disability.",
        "A teacher treated me differently because of my religion.",
        "I was refused an opportunity because of my ethnicity.",
        "Someone treated me unfairly because of my gender identity.",
        "I was excluded from a group because of my nationality.",
        "Students refused to work with me because of my disability.",
        "I was treated differently because of my religion during a school event.",
        "A classmate excluded me because of my cultural background.",
        "I was denied a school opportunity because of my gender.",
        "Someone treated me unfairly because of my ethnicity.",
        "I was excluded from an activity because of my race.",
        "Students treated me differently because of my disability.",
        "A teacher excluded me because of my religious beliefs.",
        "I was denied participation because of my cultural background.",
        "A classmate treated me unfairly because of my nationality.",
        "I was excluded because of my gender identity.",
        "Someone refused to include me because of my ethnicity.",
        "Students denied me participation because of my religion.",
        "I was treated differently because of my disability.",
        "A teacher excluded me because of my gender.",
        "I was treated unfairly because of my race.",
        "A student was excluded from a class activity because of their family background.",
        "A classmate treated me unfairly because I speak a different language at home.",
        "I was left out of a school group because of my cultural traditions.",
        "A student received different treatment because of their physical disability.",
        "A classmate refused to work with me because of my nationality.",
        "I was treated differently during a school activity because of my gender.",
        "A student made sure I could not join their group because of my cultural background.",
        "I was denied participation in an activity because of a characteristic about my identity.",
    ],

    "harassment": [
        "Someone repeatedly approaches me and makes unwanted remarks.",
        "A classmate keeps bothering me during school activities.",
        "A student repeatedly makes inappropriate jokes directed at me.",
        "Someone keeps contacting me even though I asked them not to.",
        "A classmate repeatedly makes comments that make me uncomfortable.",
        "A student continues bothering me in the hallway every day.",
        "Someone repeatedly interferes with me during class.",
        "A student keeps making unwanted personal comments.",
        "A classmate repeatedly follows me and tries to get my attention.",
        "Someone repeatedly comes to my desk despite being told to leave me alone.",
        "A student keeps making comments about me that I find uncomfortable.",
        "A classmate repeatedly interrupts and bothers me during class.",
        "Someone keeps approaching me after I have asked them to stop.",
        "A student repeatedly contacts me without permission.",
        "A classmate continues making unwanted remarks toward me.",
        "Someone repeatedly follows me between classes.",
        "A student keeps bothering me during breaks.",
        "A classmate repeatedly makes inappropriate comments about my personal life.",
        "Someone continues disturbing me even after I clearly say no.",
        "A student repeatedly tries to get my attention in unwanted ways.",
        "A classmate keeps making uncomfortable jokes directed at me.",
        "Someone repeatedly approaches me in places where I spend time.",
        "A student keeps contacting me despite my requests to stop.",
        "A classmate repeatedly makes personal comments that make me uncomfortable.",
        "Someone keeps bothering me while I am trying to study.",
        "A student repeatedly interrupts me and refuses to leave me alone.",
        "A classmate keeps following me around campus.",
        "Someone repeatedly makes unwanted remarks in the hallway.",
        "A student keeps disturbing me during school activities.",
        "A classmate repeatedly sends messages I do not want to receive.",
        "Someone continues making unwanted comments after being warned.",
        "A student repeatedly comes near me and bothers me.",
        "A classmate keeps trying to contact me even though I do not respond.",
        "Someone repeatedly makes inappropriate remarks about me.",
        "A student continues bothering me during lunch.",
        "A classmate repeatedly tries to embarrass me with unwanted comments.",
        "Someone keeps following me after school.",
        "A student repeatedly makes comments that make me feel uncomfortable.",
        "A classmate continues to bother me despite several requests to stop.",
        "Someone repeatedly interrupts my personal space.",
        "A student keeps contacting me through different accounts.",
        "A classmate repeatedly approaches me without invitation.",
        "Someone continues making unwanted jokes directed at me.",
        "A student repeatedly disturbs me while I am studying.",
        "A classmate keeps bothering me after I have clearly asked them to stop.",
        "Someone repeatedly makes unwanted comments during class.",
        "A student keeps following me around campus and trying to talk to me.",
        "A classmate repeatedly contacts me even though I do not want contact.",
        "Someone continues unwanted behavior toward me every day.",
        "A student repeatedly makes personal remarks that I find uncomfortable.",
        "A student repeatedly waits near my locker and approaches me whenever I arrive.",
        "Someone keeps interrupting my conversations with other students on purpose.",
        "A classmate repeatedly calls my name from across the room after I ask them to stop.",
        "A student keeps standing beside my seat during lessons despite my requests for space.",
        "Someone repeatedly tries to follow me when I move to another area of campus.",
        "A classmate keeps asking me personal questions after I tell them I do not want to answer.",
        "A student repeatedly appears near my usual study area and bothers me.",
        "Someone keeps trying to get my attention while I am participating in class.",
        "A classmate repeatedly waits for me outside the classroom to speak to me.",
        "A student continues approaching me during dismissal even after I request distance.",
        "Someone repeatedly interrupts my schoolwork by coming to my desk without permission.",
    ],

    "other": [
        "I need help replacing my lost student ID.",
        "I need information about a school service.",
        "I would like assistance understanding one of the services available to students.",
        "I need help finding the student affairs office.",
        "I want to ask about the school's counseling schedule.",
        "I need information about submitting a school form.",
        "I would like help understanding a campus procedure.",
        "I need assistance locating a school office.",
        "I want to know where students can request documents.",
        "I need help understanding the student handbook.",
        "I would like information about campus services.",
        "I need assistance with a general student concern.",
        "I want to ask about the process for requesting school records.",
        "I need information about student support services.",
        "I would like help finding the correct school department.",
        "I need assistance with a school-related question.",
        "I want to know how to request a replacement school document.",
        "I need information about campus rules.",
        "I would like assistance with a general school inquiry.",
        "I need help understanding a school policy.",
        "I want to ask where I can submit a student request.",
        "I need information about student activities.",
        "I would like help contacting a school office.",
        "I need assistance understanding a campus procedure.",
        "I want information about school resources.",
        "I need help finding information about enrollment services.",
        "I would like to ask about available student programs.",
        "I need assistance with a general campus concern.",
        "I want to know how to contact student services.",
        "I need information about school requirements.",
        "I would like help understanding a school process.",
        "I need assistance locating a campus resource.",
        "I want to ask about student organization procedures.",
        "I need information about requesting school documents.",
        "I would like assistance with a non-emergency school concern.",
        "I need help understanding a general school announcement.",
        "I want information about student support resources.",
        "I need assistance contacting the appropriate department.",
        "I would like to know where to ask about school services.",
        "I need help with a general student request.",
        "I want information about campus facilities.",
        "I need assistance understanding a school requirement.",
        "I would like help finding a specific school service.",
        "I need information about student activities and programs.",
        "I want to ask about a school administrative process.",
        "I need help locating a campus office.",
        "I would like assistance with a general academic service question.",
        "I need information about available campus resources.",
        "I want help understanding a school-related procedure.",
        "I need assistance with a general student inquiry.",
        "I need help with a school concern that does not fit the available incident categories.",
        "I want to report a student safety concern that is difficult to classify.",
    ],

    "self_harm": [
        "I have been thinking about hurting myself.",
        "I feel like I might hurt myself and need someone to talk to.",
        "I am struggling with thoughts of harming myself.",
        "Sometimes I think about ending my life.",
        "I have thoughts about hurting myself when I feel overwhelmed.",
        "I am afraid I might hurt myself.",
        "I do not know how to cope with thoughts of self-harm.",
        "I have been thinking about suicide.",
        "I feel like hurting myself when things become too difficult.",
        "I need help because I am having thoughts of harming myself.",
        "I have been having thoughts about ending my life.",
        "I am worried that I might harm myself.",
        "I keep thinking about hurting myself.",
        "I feel unsafe with my own thoughts right now.",
        "I need someone to help me because I am thinking about self-harm.",
        "I have thoughts of suicide that are difficult to control.",
        "I am struggling with urges to hurt myself.",
        "I feel like I may harm myself if things continue this way.",
        "I have been thinking about taking my own life.",
        "I need immediate support because I want to hurt myself.",
        "I am having repeated thoughts about self-harm.",
        "I feel overwhelmed and keep thinking about hurting myself.",
        "I am scared of what I might do to myself.",
        "I need help dealing with suicidal thoughts.",
        "I have been considering harming myself.",
        "I feel like I cannot stop thinking about self-harm.",
        "I am experiencing thoughts about suicide.",
        "I want help because I am thinking about hurting myself.",
        "I am struggling with urges to harm myself.",
        "I feel like hurting myself when I am alone.",
        "I am having serious thoughts about ending my life.",
        "I am worried about my own safety because of self-harm thoughts.",
        "I keep having thoughts of suicide.",
        "I need someone to talk to about wanting to hurt myself.",
        "I feel like I may hurt myself tonight.",
        "I am struggling to keep myself safe from self-harm.",
        "I have thoughts about harming myself when I become upset.",
        "I am afraid I might act on thoughts of suicide.",
        "I need support because I keep thinking about ending my life.",
        "I have been experiencing strong urges to hurt myself.",
        "I feel unsafe because I am thinking about self-harm.",
        "I am having thoughts of taking my own life.",
        "I need help because I am worried about harming myself.",
        "I keep thinking that I should hurt myself.",
        "I am struggling with suicidal thoughts.",
        "I feel like I need help staying safe from myself.",
        "I have thoughts about self-harm that will not go away.",
        "I am worried I may act on thoughts of hurting myself.",
        "I need immediate support for thoughts about suicide.",
        "I have been thinking about hurting myself and I need someone to talk to.",
        "I feel like I might hurt myself when things become overwhelming.",
        "I have thoughts about ending my life and I do not know who to tell.",
        "I am struggling with thoughts of self-injury and need help from someone at school.",
        "I am afraid I may hurt myself because I cannot cope with what I am experiencing.",
        "I have been having thoughts of suicide and would like support from a counselor.",
    ],

    "threat": [
        "Someone told me they were going to hurt me.",
        "A student threatened to attack me after school.",
        "Someone said they would seriously harm me.",
        "A classmate warned me that they would hurt me.",
        "Someone threatened to hurt my family.",
        "A student told me they planned to attack me.",
        "Someone threatened me during an argument.",
        "A classmate said they would physically hurt me.",
        "Someone warned me that they would come after me.",
        "A student made a threat against me.",
        "Someone told me I would be attacked.",
        "A classmate threatened to beat me up.",
        "Someone said they were planning to hurt me.",
        "A student threatened me through a message.",
        "Someone warned me that I would be harmed.",
        "A classmate threatened violence against me.",
        "Someone told me they would attack me later.",
        "A student made a serious threat toward me.",
        "Someone threatened to hurt someone close to me.",
        "A classmate warned me about an intended attack.",
        "Someone said they would physically harm me.",
        "A student threatened me after class.",
        "Someone told me they wanted to hurt me.",
        "A classmate made a threat against my safety.",
        "Someone warned me that they planned to attack me.",
        "A student threatened to seriously injure me.",
        "Someone told me they would hurt me tomorrow.",
        "A classmate threatened to harm me if I reported them.",
        "Someone made a threat toward me at school.",
        "A student warned me that I would be attacked.",
        "Someone threatened me during lunch.",
        "A classmate said they intended to hurt me.",
        "Someone threatened to physically injure me.",
        "A student made threatening comments toward me.",
        "Someone warned me that they would come to my home.",
        "A classmate threatened to attack me outside school.",
        "Someone told me they were going to seriously hurt me.",
        "A student threatened me after a disagreement.",
        "Someone made a direct threat against me.",
        "A classmate warned me that they wanted to harm me.",
        "Someone threatened to hurt my friend.",
        "A student said they planned to physically attack me.",
        "Someone warned me about harming me later.",
        "A classmate made threatening statements toward me.",
        "Someone threatened to injure me during an argument.",
        "A student told me they would attack me if I spoke up.",
        "Someone threatened my safety at school.",
        "A classmate warned me that they would hurt me soon.",
        "Someone made a serious threat toward my family.",
        "A student threatened to harm someone I care about.",
        "A student told me they were going to hurt me after school.",
        "Someone threatened to attack me if I reported what happened.",
        "A classmate warned me that I would be harmed if I did not do what they wanted.",
        "A student sent me a message saying they would hurt me at school.",
        "Someone threatened me after an argument and I am concerned about my safety.",
        "A classmate said they would physically harm me if I told a teacher.",
        "A student made a direct threat against me during a school activity.",
    ],

    "violence": [
        "A student punched me during an argument.",
        "Someone physically attacked me after class.",
        "A classmate pushed me in the hallway.",
        "A student hit me during a disagreement.",
        "Someone physically assaulted me at school.",
        "A classmate kicked me during an argument.",
        "A student shoved me near the classroom.",
        "Someone struck me during lunch.",
        "A classmate physically attacked me outside the school.",
        "A student slapped me during an argument.",
        "Someone punched me after school.",
        "A classmate pushed me to the ground.",
        "A student physically hurt me during a fight.",
        "Someone attacked me near the school entrance.",
        "A classmate hit me during recess.",
        "A student kicked me during an altercation.",
        "Someone shoved me while we were arguing.",
        "A classmate physically assaulted me in the hallway.",
        "A student struck me during a disagreement.",
        "Someone attacked me during a school activity.",
        "A classmate punched me in the classroom.",
        "A student pushed me during an argument.",
        "Someone physically attacked me near the cafeteria.",
        "A classmate slapped me during a confrontation.",
        "A student hit me outside the classroom.",
        "Someone kicked me during a fight.",
        "A classmate shoved me near the library.",
        "A student physically attacked me during lunch.",
        "Someone struck me after school.",
        "A classmate pushed me against a wall.",
        "A student punched me during a confrontation.",
        "Someone physically hurt me during an argument.",
        "A classmate hit me near the school gate.",
        "A student shoved me during class.",
        "Someone attacked me in the hallway.",
        "A classmate kicked me during a disagreement.",
        "A student physically assaulted me after school.",
        "Someone hit me during a school event.",
        "A classmate pushed me during a dispute.",
        "A student struck me near the cafeteria.",
        "Someone physically attacked me during recess.",
        "A classmate punched me after an argument.",
        "A student slapped me in the hallway.",
        "Someone kicked me near the classroom.",
        "A classmate physically hurt me during a confrontation.",
        "A student hit me outside the school.",
        "Someone shoved me during lunch.",
        "A classmate attacked me after class.",
        "A student physically assaulted me near the library.",
        "Someone struck me during a fight.",
        "A student physically attacked me during an argument at school.",
        "A classmate hit another student during a disagreement.",
        "Someone pushed me forcefully in the hallway and I was injured.",
        "A student physically assaulted me during a school activity.",
        "Two students got into a physical fight on school grounds.",
    ],
}


# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------

def normalize(text):
    return " ".join(str(text).lower().strip().split())


print("Loading datasets...")

train_df = pd.read_csv(TRAIN_PATH)
test_df = pd.read_csv(TEST_PATH)

print(f"Current training examples: {len(train_df)}")
print(f"Testing examples: {len(test_df)}")

print("\nCurrent training distribution:")
print(train_df["category"].value_counts().sort_index())


# -------------------------------------------------------------------
# Validate existing datasets
# -------------------------------------------------------------------

required_categories = sorted(EXAMPLES.keys())

train_counts = train_df["category"].value_counts()

for category in required_categories:
    current = int(train_counts.get(category, 0))

    if current != 100:
        raise ValueError(
            f"{category} currently has {current} training examples. "
            "Expected exactly 100."
        )

if len(test_df) != 160:
    raise ValueError(
        f"Test dataset contains {len(test_df)} examples. "
        "Expected exactly 160. The test set must remain unchanged."
    )


# -------------------------------------------------------------------
# Build normalized lookup sets
# -------------------------------------------------------------------

existing_train = {
    normalize(text)
    for text in train_df["text"].astype(str)
}

existing_test = {
    normalize(text)
    for text in test_df["text"].astype(str)
}

existing_all = existing_train | existing_test


# -------------------------------------------------------------------
# Select exactly 50 genuinely new examples per category
# -------------------------------------------------------------------

new_rows = []

print("\nChecking new examples...")

for category in required_categories:
    candidates = EXAMPLES[category]

    selected = []
    seen_in_category = set()

    for text in candidates:
        normalized = normalize(text)

        if normalized in existing_all:
            continue

        if normalized in seen_in_category:
            continue

        selected.append(text)
        seen_in_category.add(normalized)

        if len(selected) == NEW_PER_CATEGORY:
            break

    print(f"{category}: {len(selected)} new examples")

    if len(selected) != NEW_PER_CATEGORY:
        raise ValueError(
            f"{category} only has {len(selected)} unique new examples "
            f"available. Need exactly {NEW_PER_CATEGORY}."
        )

    for text in selected:
        new_rows.append(
            {
                "text": text,
                "category": category,
            }
        )


# -------------------------------------------------------------------
# Create expanded dataset in memory
# -------------------------------------------------------------------

new_df = pd.DataFrame(new_rows)

expanded_df = pd.concat(
    [train_df, new_df],
    ignore_index=True,
)


# -------------------------------------------------------------------
# Final validation
# -------------------------------------------------------------------

print("\nValidating final dataset...")

expected_total = 1200

if len(expanded_df) != expected_total:
    raise ValueError(
        f"Expected {expected_total} training examples, "
        f"got {len(expanded_df)}."
    )


final_counts = expanded_df["category"].value_counts()

print("\nFinal training distribution:")
print(final_counts.sort_index())

for category in required_categories:
    count = int(final_counts.get(category, 0))

    if count != TARGET_PER_CATEGORY:
        raise ValueError(
            f"{category} has {count} examples. "
            f"Expected exactly {TARGET_PER_CATEGORY}."
        )


# Check duplicate training text
normalized_training = expanded_df["text"].map(normalize)

duplicate_count = normalized_training.duplicated().sum()

if duplicate_count != 0:
    raise ValueError(
        f"Found {duplicate_count} duplicate training examples."
    )


# Check train/test overlap
overlap = (
    set(normalized_training)
    & existing_test
)

if overlap:
    example = next(iter(overlap))

    raise ValueError(
        "Training/test overlap detected:\n"
        f"{example}"
    )


print("\nNo duplicate training examples detected.")
print("No training/test text overlap detected.")
print("All categories contain exactly 150 examples.")


# -------------------------------------------------------------------
# Save
# -------------------------------------------------------------------

expanded_df.to_csv(TRAIN_PATH, index=False)

print("\n" + "=" * 60)
print("TRAINING DATASET EXPANSION COMPLETE")
print("=" * 60)

print(f"\nExamples added: {len(new_df)}")
print(f"Final training examples: {len(expanded_df)}")
print(f"Test examples unchanged: {len(test_df)}")

print("\nTraining dataset saved to:")
print(TRAIN_PATH)

print("\nDone!")