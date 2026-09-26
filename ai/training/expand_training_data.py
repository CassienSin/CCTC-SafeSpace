from pathlib import Path

import pandas as pd


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

TRAIN_PATH = BASE_DIR / "dataset" / "train.csv"


# --------------------------------------------------
# Settings
# --------------------------------------------------

CATEGORIES = [
    "bullying",
    "cyberbullying",
    "discrimination",
    "harassment",
    "other",
    "self_harm",
    "threat",
    "violence",
]


# --------------------------------------------------
# New training examples
# --------------------------------------------------
#
# These are additional synthetic examples.
# They are intentionally varied in wording and
# sentence structure.
#
# Existing examples in train.csv are preserved.
# --------------------------------------------------

NEW_EXAMPLES = {

    "bullying": [
        "A group of students makes fun of me whenever I enter the classroom.",
        "My classmates regularly laugh at the way I speak.",
        "A student keeps calling me insulting names during lunch.",
        "Several students keep making jokes about my appearance.",
        "A classmate repeatedly mocks my clothes in front of others.",
        "Students in my class keep teasing me every morning.",
        "Someone repeatedly makes fun of my grades in front of everyone.",
        "A student keeps humiliating me whenever I answer a question.",
        "My classmates constantly make jokes about me during group activities.",
        "A student keeps telling others that I am stupid.",
        "I am repeatedly being laughed at by the same group of students.",
        "Someone keeps making embarrassing comments about me at school.",
        "A classmate repeatedly calls me offensive nicknames.",
        "Students keep teasing me because I am quiet.",
        "A group keeps making fun of my accent.",
        "Someone keeps insulting me whenever the teacher leaves the room.",
        "A student repeatedly embarrasses me in front of my classmates.",
        "My classmates keep joking about something personal about me.",
        "I am being picked on by the same students every week.",
        "A student keeps mocking me during physical education.",
        "Students regularly laugh at me when I walk past them.",
        "A classmate keeps making jokes about my family.",
        "Someone repeatedly calls me names that make me uncomfortable.",
        "A group of students keeps targeting me with hurtful jokes.",
        "I keep getting teased because of the way I look.",
        "A student makes fun of me whenever I participate in class.",
        "My classmates repeatedly make me the subject of humiliating jokes.",
        "Someone keeps ridiculing me in front of other students.",
        "A student keeps laughing at me and encouraging others to join.",
        "I am constantly being mocked by students in my section.",
        "My classmates keep insulting me during recess.",
        "Someone repeatedly makes comments intended to embarrass me.",
        "A group of students keeps making jokes about my personal life.",
        "A classmate keeps putting me down whenever we work together.",
        "Students keep teasing me even after I ask them to stop.",
        "Someone regularly calls me hurtful names at school.",
        "A student repeatedly makes fun of my mistakes.",
        "My classmates keep laughing whenever I speak.",
        "I am repeatedly being made fun of by another student.",
        "A group keeps singling me out for jokes.",
        "Someone keeps humiliating me in the hallway.",
        "A classmate repeatedly insults me during lunch.",
        "Students keep mocking me because I am different from them.",
        "A student constantly makes jokes at my expense.",
        "My classmates repeatedly tease me about my interests.",
        "Someone keeps trying to embarrass me in front of teachers.",
        "A group of students keeps laughing at me during class.",
        "A student repeatedly makes insulting remarks about my abilities.",
        "I am being targeted with repeated verbal insults.",
        "Someone keeps making me feel ashamed through repeated teasing.",
        "Students repeatedly make hurtful jokes about me.",
        "A classmate keeps mocking my way of doing schoolwork.",
        "My classmates repeatedly point out my mistakes to embarrass me.",
        "A student keeps insulting me whenever we pass each other.",
        "Someone repeatedly tries to make me look foolish.",
        "A group keeps teasing me even though I have asked them to stop.",
        "Students keep making personal jokes about me.",
        "A classmate repeatedly laughs at me when I speak.",
        "Someone keeps calling me names during school activities.",
        "I am repeatedly being picked on by students in my class.",
        "A student keeps making cruel jokes about me.",
        "My classmates keep mocking me because of my hobbies.",
        "Someone repeatedly embarrasses me in front of my friends.",
        "A group of students keeps making fun of my appearance.",
        "A classmate continues to insult me every day.",
        "Students repeatedly tease me during breaks.",
        "Someone keeps making humiliating comments about me.",
        "A student repeatedly makes jokes about my abilities.",
        "My classmates keep putting me down during class discussions.",
        "Someone keeps mocking me despite being told to stop.",
        "A group of students repeatedly laughs at me.",
        "A classmate keeps making insulting jokes about me.",
        "Students continue to make fun of me whenever they see me.",
        "Someone repeatedly calls me embarrassing names.",
        "A student keeps humiliating me around other students.",
        "My classmates repeatedly make jokes about things I cannot change.",
        "A group keeps targeting me with insults at school.",
        "Someone keeps teasing me about my appearance.",
        "A student repeatedly mocks me in front of the class.",
        "Students keep making fun of me during group work.",
        "A classmate constantly makes hurtful comments toward me.",
        "Someone repeatedly tries to embarrass me at school.",
        "I keep being teased and insulted by another student.",
        "A group of students keeps picking on me.",
    ],

    "cyberbullying": [
        "Someone keeps sending me insulting messages online.",
        "A student posts embarrassing comments about me on social media.",
        "Someone created a fake account to make fun of me.",
        "A classmate keeps tagging me in humiliating posts.",
        "Students are spreading hurtful rumors about me through group chats.",
        "Someone keeps sending threatening jokes through messages.",
        "A student posted an embarrassing picture of me without permission.",
        "Someone is repeatedly insulting me in an online class group.",
        "A group chat is being used to make fun of me.",
        "Someone keeps sharing edited pictures of me online.",
        "A classmate created a post making me look foolish.",
        "Students keep posting negative comments about me.",
        "Someone is spreading rumors about me through social media.",
        "A student keeps sending me cruel messages.",
        "Someone shared private information about me online.",
        "A classmate keeps making insulting posts about me.",
        "Students created a group chat specifically to mock me.",
        "Someone repeatedly comments embarrassing things on my photos.",
        "A student keeps reposting an embarrassing picture of me.",
        "Someone is using social media to humiliate me.",
        "A classmate keeps sending screenshots of private conversations to others.",
        "Someone made a fake profile using my name and photo.",
        "Students are making jokes about me in an online group.",
        "Someone keeps posting insulting memes about me.",
        "A student uploaded a video of me to embarrass me.",
        "Someone repeatedly sends hurtful messages to my phone.",
        "A classmate keeps making fun of me in a school group chat.",
        "Students are spreading embarrassing information about me online.",
        "Someone keeps replying to my posts with insults.",
        "A student created an account to ridicule me.",
        "Someone shared an embarrassing recording of me online.",
        "My classmates keep mocking me through messages.",
        "A student keeps posting rumors about me.",
        "Someone repeatedly sends me humiliating images.",
        "A group is using social media to make fun of me.",
        "Someone keeps commenting insulting things on my posts.",
        "A classmate shared my private photo without permission.",
        "Students keep making hurtful jokes about me in a chat.",
        "Someone is impersonating me online to embarrass me.",
        "A student keeps sending insulting voice messages.",
        "Someone posted personal information about me to embarrass me.",
        "A classmate keeps sharing screenshots of me without permission.",
        "Students are spreading rumors about me on social media.",
        "Someone repeatedly makes insulting videos about me.",
        "A group chat keeps targeting me with cruel comments.",
        "A student keeps tagging me in posts meant to embarrass me.",
        "Someone made an embarrassing meme using my photo.",
        "Students keep sending me hurtful messages online.",
        "A classmate repeatedly posts jokes about me online.",
        "Someone is using a fake account to insult me.",
        "A student shared an embarrassing photo of me with other students.",
        "Someone keeps making humiliating comments in our online group.",
        "A classmate repeatedly posts negative things about me.",
        "Students created edited images of me and shared them online.",
        "Someone keeps sending me unwanted insulting messages.",
        "A student posted a video of me without my permission.",
        "Someone repeatedly shares rumors about me online.",
        "A group of students keeps mocking me through social media.",
        "Someone keeps using my picture in insulting posts.",
        "A classmate sends embarrassing messages about me to others.",
        "Students are using an online group to ridicule me.",
        "Someone created a fake social media account pretending to be me.",
        "A student keeps commenting insults on my profile.",
        "Someone repeatedly shares private messages without permission.",
        "A classmate posted something humiliating about me.",
        "Students keep making fun of me through an online chat.",
        "Someone is spreading lies about me on social media.",
        "A student keeps sending edited photos of me to classmates.",
        "Someone repeatedly posts embarrassing content about me.",
        "A group chat is filled with insults directed at me.",
        "A classmate keeps using social media to embarrass me.",
        "Someone made a fake account to post rumors about me.",
        "Students repeatedly share embarrassing content about me online.",
        "Someone keeps sending cruel comments through messaging apps.",
        "A student uploaded an embarrassing recording without asking me.",
        "Someone repeatedly tags me in insulting posts.",
        "A classmate keeps spreading rumors through online messages.",
        "Students are mocking me in a group chat.",
        "Someone continues posting embarrassing things about me online.",
        "A student repeatedly uses social media to insult me.",
        "Someone is targeting me with repeated online harassment.",
        "A group of students keeps posting hurtful content about me.",
        "Someone keeps sharing my photos to embarrass me.",
        "Someone keeps sending embarrassing comments about me in our class group chat.",
    ],

    "discrimination": [
        "I was treated unfairly because of my disability.",
        "A student excluded me because of my religion.",
        "Someone made negative comments about my ethnicity.",
        "I was treated differently because of my gender.",
        "A classmate refuses to work with me because of my background.",
        "I was excluded from an activity because of my disability.",
        "Someone made insulting remarks about my nationality.",
        "A student told me I did not belong because of my religion.",
        "I was treated unfairly because of my appearance.",
        "Someone made offensive comments about my cultural background.",
        "A group excluded me because of my ethnicity.",
        "I was denied participation because of my disability.",
        "A student mocked my religious practices.",
        "Someone treated me differently because of where I come from.",
        "I experienced unfair treatment because of my gender.",
        "A classmate made offensive comments about my culture.",
        "Students excluded me because I have a disability.",
        "Someone made stereotypes about my nationality.",
        "I was treated differently because of my religion.",
        "A student refused to include me because of my background.",
        "Someone made discriminatory comments about my ethnicity.",
        "I was excluded from a school activity because of who I am.",
        "A classmate made jokes about my disability.",
        "Someone judged me based on my cultural background.",
        "Students treated me unfairly because of my religion.",
        "A student made insulting remarks about my nationality.",
        "I was excluded because of my gender.",
        "Someone refused to work with me because of my disability.",
        "A classmate made offensive jokes about my ethnicity.",
        "Students made assumptions about me because of my culture.",
        "I was treated unfairly because of my background.",
        "Someone made negative comments about my religion.",
        "A student excluded me because of my nationality.",
        "I experienced unfair treatment because of my disability.",
        "Someone mocked my cultural traditions.",
        "A group treated me differently because of my ethnicity.",
        "A classmate made inappropriate comments about my gender.",
        "I was excluded because of my religious beliefs.",
        "Someone made offensive statements about people from my background.",
        "A student treated me differently because I have a disability.",
        "I was judged because of my nationality.",
        "Someone made discriminatory jokes about my culture.",
        "A classmate excluded me from a group because of my religion.",
        "Students made negative assumptions about my ethnicity.",
        "I was treated unfairly because of my gender identity.",
        "Someone made comments suggesting people like me are inferior.",
        "A student refused to include me because of my disability.",
        "I experienced discrimination because of my cultural background.",
        "Someone made insulting comments about my religion.",
        "A group excluded me because of where my family comes from.",
        "A classmate made offensive jokes about my disability.",
        "I was treated differently because of my ethnicity.",
        "Someone judged me based on my religion.",
        "Students excluded me because of my nationality.",
        "A student made discriminatory remarks about my gender.",
        "I was denied an opportunity because of my background.",
        "Someone mocked me because of my disability.",
        "A classmate made negative comments about my culture.",
        "Students treated me differently because of my religion.",
        "I was excluded from a group because of my ethnicity.",
        "Someone made stereotypes about people from my country.",
        "A student refused to cooperate with me because of my disability.",
        "I experienced unfair treatment because of my gender.",
        "Someone made offensive comments about my nationality.",
        "A classmate excluded me because of my cultural background.",
        "Students made discriminatory jokes about my religion.",
        "I was treated unfairly because of my ethnicity.",
        "Someone mocked my cultural practices.",
        "A student made negative remarks about my disability.",
        "I was excluded because of my nationality.",
        "Someone treated me differently because of my gender.",
        "A group made offensive comments about my religion.",
        "A classmate judged me because of my background.",
        "Students excluded me because of my disability.",
        "Someone made discriminatory remarks about my ethnicity.",
        "I was treated unfairly because of my cultural identity.",
        "A student made insulting comments about my nationality.",
        "Someone refused to include me because of my religion.",
        "A classmate made offensive comments about my disability.",
        "I experienced discrimination because of my ethnicity.",
        "Students treated me differently because of my background.",
    ],

    "harassment": [
        "A student keeps following me around campus.",
        "Someone repeatedly waits outside my classroom.",
        "A classmate keeps bothering me after I ask them to stop.",
        "Someone repeatedly sends unwanted messages to me.",
        "A student keeps approaching me even though I avoid them.",
        "Someone repeatedly makes unwanted comments about me.",
        "A classmate keeps trying to contact me after I said no.",
        "Someone follows me whenever I leave school.",
        "A student repeatedly interrupts me and refuses to leave me alone.",
        "Someone keeps coming near me despite my requests for space.",
        "A classmate repeatedly asks personal questions that make me uncomfortable.",
        "Someone keeps waiting for me outside the building.",
        "A student repeatedly tries to get my attention after I ask them to stop.",
        "Someone keeps following me between classes.",
        "A classmate repeatedly contacts me even after I block them.",
        "Someone keeps making unwanted remarks toward me.",
        "A student repeatedly comes to places where I am.",
        "Someone keeps bothering me during breaks.",
        "A classmate repeatedly tries to start unwanted conversations.",
        "Someone keeps following me around school grounds.",
        "A student repeatedly makes me uncomfortable with unwanted attention.",
        "Someone keeps approaching me after I told them to leave me alone.",
        "A classmate repeatedly asks me to meet them even though I decline.",
        "Someone keeps waiting near my usual classroom.",
        "A student repeatedly contacts my friends to reach me.",
        "Someone keeps bothering me during school activities.",
        "A classmate repeatedly comes near my desk without permission.",
        "Someone follows me whenever I walk home from school.",
        "A student repeatedly makes unwanted comments about my appearance.",
        "Someone keeps trying to get personal information from me.",
        "A classmate repeatedly calls me despite being asked to stop.",
        "Someone keeps showing up wherever I am on campus.",
        "A student repeatedly interrupts my personal space.",
        "Someone keeps asking me questions that I do not want to answer.",
        "A classmate repeatedly approaches me after I say no.",
        "Someone continues bothering me even after teachers tell them to stop.",
        "A student keeps following me during breaks.",
        "Someone repeatedly makes unwanted remarks in person.",
        "A classmate keeps contacting me from different accounts.",
        "Someone repeatedly tries to meet me without my permission.",
        "A student keeps coming to my classroom to bother me.",
        "Someone follows me around campus even when I change routes.",
        "A classmate repeatedly asks where I am going.",
        "Someone keeps waiting near places I regularly visit.",
        "A student repeatedly sends unwanted messages.",
        "Someone keeps approaching me despite my discomfort.",
        "A classmate repeatedly interrupts me when I am with friends.",
        "Someone keeps following me after school.",
        "A student repeatedly asks me personal questions.",
        "Someone continues contacting me after I block them.",
        "A classmate keeps trying to get my attention after I refuse.",
        "Someone repeatedly comes too close to me.",
        "A student keeps bothering me during class breaks.",
        "Someone repeatedly waits outside the school gate for me.",
        "A classmate keeps approaching me even though I avoid them.",
        "Someone repeatedly makes comments that make me uncomfortable.",
        "A student keeps following me between buildings.",
        "Someone repeatedly contacts my friends about me.",
        "A classmate keeps appearing near my classroom.",
        "Someone continues unwanted contact after I ask them to stop.",
        "A student repeatedly tries to talk to me when I do not want to.",
        "Someone keeps following me around the campus.",
        "A classmate repeatedly asks me to spend time with them after I decline.",
        "Someone keeps bothering me during lunch.",
        "A student repeatedly approaches me without permission.",
        "Someone keeps contacting me through different messaging accounts.",
        "A classmate repeatedly makes unwanted personal comments.",
        "Someone keeps waiting near my usual route.",
        "A student follows me even after I change where I walk.",
        "Someone repeatedly invades my personal space.",
        "A classmate keeps trying to contact me after I say no.",
        "Someone continues unwanted attention despite my requests.",
        "A student repeatedly comes to my location without being invited.",
        "Someone keeps bothering me whenever they see me.",
        "A classmate repeatedly asks intrusive questions.",
        "Someone follows me around school and makes me uncomfortable.",
        "A student repeatedly contacts me even though I do not respond.",
        "Someone keeps approaching me after I clearly ask them to stop.",
        "A classmate repeatedly waits near my classroom.",
        "Someone keeps following me on campus.",
        "A student repeatedly gives me unwanted attention.",
        "Someone continues bothering me despite being told to stop.",
        "A classmate repeatedly tries to contact me without permission.",
    ],

    "other": [
        "I lost my student ID and need help replacing it.",
        "I forgot my school account password.",
        "I need help finding a missing notebook.",
        "My school account is not working properly.",
        "I lost an item somewhere on campus.",
        "I need information about replacing my student card.",
        "I cannot access my school email.",
        "I found an item that belongs to another student.",
        "I need help locating a classroom.",
        "My student account is locked.",
        "I need assistance with a school document.",
        "I misplaced my school supplies.",
        "I need help contacting the registrar.",
        "I cannot remember my student number.",
        "I need information about a school service.",
        "I lost my bag on campus.",
        "I need help finding the student services office.",
        "My school portal is not loading.",
        "I need assistance with an enrollment document.",
        "I found a phone in the classroom.",
        "I need help recovering access to my account.",
        "I misplaced my library card.",
        "I need information about school procedures.",
        "I lost my notebook before class.",
        "I need help contacting a teacher.",
        "My student portal is showing an error.",
        "I need assistance finding a school office.",
        "I lost my school ID somewhere on campus.",
        "I need information about requesting a document.",
        "I found someone's belongings in the hallway.",
        "I cannot log into my school account.",
        "I need help with a missing school requirement.",
        "I misplaced my calculator.",
        "I need information about student services.",
        "My account password needs to be reset.",
        "I need help finding something I left at school.",
        "I lost my umbrella on campus.",
        "I need assistance with a school form.",
        "I cannot access the student portal.",
        "I need help locating a department office.",
        "I found a wallet in the classroom.",
        "I need information about replacing a lost card.",
        "I misplaced my school documents.",
        "I need assistance with a general school concern.",
        "My school email is not working.",
        "I need help contacting the registrar's office.",
        "I lost a book from the library.",
        "I need information about campus services.",
        "I forgot the password for my student account.",
        "I need help finding a classroom.",
        "I misplaced my ID card.",
        "I need assistance with a school request.",
        "My account is not letting me sign in.",
        "I found an item in the hallway.",
        "I need information about a school form.",
        "I lost my headphones at school.",
        "I need help with my student portal.",
        "I cannot access my school email account.",
        "I need assistance finding an office.",
        "I misplaced an important document.",
        "I need information about school procedures.",
        "I lost my calculator during class.",
        "I need help contacting student services.",
        "My school account has a login problem.",
        "I found someone's ID card.",
        "I need assistance replacing something I lost.",
        "I need help finding a missing item.",
        "I forgot my student account password.",
        "I need information about a campus service.",
        "I lost a personal item in the library.",
        "I need help with a school document.",
        "My student portal is not working.",
        "I need assistance contacting an office.",
        "I found something in the classroom that belongs to someone.",
        "I misplaced my school ID.",
        "I need help recovering my account.",
        "I need information about student services.",
        "I lost something on campus and need help finding it.",
        "I need assistance with a general school issue.",
        "My school account is inaccessible.",
        "I found a lost item on campus.",
    ],

    "self_harm": [
        "I have been thinking about hurting myself.",
        "I feel like I might hurt myself.",
        "I am struggling with thoughts of self-harm.",
        "I keep thinking about hurting myself when I feel overwhelmed.",
        "I do not know how to deal with thoughts of hurting myself.",
        "I have been having thoughts about harming myself.",
        "I am afraid I might hurt myself.",
        "I keep thinking that I should hurt myself.",
        "I feel overwhelmed and have thoughts of self-harm.",
        "I need someone to talk to because I want to hurt myself.",
        "I have been thinking about injuring myself.",
        "I am having a difficult time and thoughts of self-harm keep coming back.",
        "I feel like hurting myself when things become too much.",
        "I am worried about thoughts I have about hurting myself.",
        "I have thoughts of harming myself and need support.",
        "I am struggling with urges to hurt myself.",
        "I keep thinking about self-harm.",
        "I feel unsafe with my own thoughts.",
        "I am afraid of what I might do to myself.",
        "I have been thinking about injuring myself lately.",
        "I do not feel safe because I want to hurt myself.",
        "I am experiencing thoughts about self-harm.",
        "I need help dealing with urges to harm myself.",
        "I have thoughts of hurting myself when I am stressed.",
        "I am scared that I might hurt myself.",
        "I keep having thoughts about harming myself.",
        "I feel like I cannot control my urge to hurt myself.",
        "I need someone to listen because I am thinking about self-harm.",
        "I have been struggling with thoughts of injuring myself.",
        "I am worried that I could hurt myself.",
        "I feel overwhelmed and want to hurt myself.",
        "I keep thinking about harming myself when I am alone.",
        "I am having urges to hurt myself.",
        "I need help because I am thinking about hurting myself.",
        "I do not know what to do about thoughts of self-harm.",
        "I am struggling with wanting to injure myself.",
        "I feel like hurting myself and need support.",
        "I am afraid I will hurt myself.",
        "I have been thinking about self-harm for several days.",
        "I am having repeated thoughts about harming myself.",
        "I feel unsafe because of thoughts about hurting myself.",
        "I need someone to talk to about self-harm thoughts.",
        "I keep having urges to injure myself.",
        "I am struggling to keep myself from hurting myself.",
        "I feel overwhelmed by thoughts of self-harm.",
        "I am worried about my thoughts of hurting myself.",
        "I have been thinking about harming myself recently.",
        "I need help because I do not feel safe with myself.",
        "I am experiencing urges to hurt myself.",
        "I keep thinking about injuring myself when I am upset.",
        "I am afraid I may harm myself.",
        "I have thoughts about hurting myself and need help.",
        "I am struggling with self-harm thoughts.",
        "I feel like I want to hurt myself.",
        "I need support because I am thinking about self-harm.",
        "I have been having urges to injure myself.",
        "I am worried that I might hurt myself when I am alone.",
        "I keep thinking about harming myself when I feel stressed.",
        "I am not feeling safe because of thoughts about self-harm.",
        "I need someone to help me with thoughts of hurting myself.",
        "I am experiencing repeated thoughts about harming myself.",
        "I feel like I could hurt myself.",
        "I am struggling with an urge to hurt myself.",
        "I have been thinking about injuring myself and need support.",
        "I am afraid of hurting myself.",
        "I keep having thoughts about self-harm.",
        "I feel overwhelmed and unsafe with my thoughts.",
        "I need help because I am having urges to hurt myself.",
        "I am worried I may injure myself.",
        "I have thoughts about harming myself when I am upset.",
        "I am struggling with thoughts of hurting myself.",
        "I do not feel safe with myself right now.",
        "I need support because I want to harm myself.",
        "I keep thinking about hurting myself and need help.",
        "I am having difficult thoughts about self-harm.",
        "I feel like I might injure myself.",
        "I am scared of acting on thoughts of hurting myself.",
        "I have repeated urges to harm myself.",
        "I need help because I am struggling with self-harm.",
        "I am worried about an urge to hurt myself.",
        "I have been thinking about harming myself and want support.",
    ],

    "threat": [
        "A student told me they would hurt me tomorrow.",
        "Someone threatened to attack me after school.",
        "A classmate said they were going to hurt me.",
        "Someone told me I would regret it if I reported them.",
        "A student threatened me during an argument.",
        "Someone said they would come after me.",
        "A classmate warned me that they would hurt me.",
        "Someone threatened to beat me up.",
        "A student told me they planned to harm me.",
        "Someone said they were going to attack me.",
        "A classmate threatened me through a message.",
        "Someone told me they would hurt my family.",
        "A student threatened to find me after school.",
        "Someone warned me not to report what happened.",
        "A classmate said they would physically hurt me.",
        "Someone threatened me during lunch.",
        "A student told me they were going to attack me later.",
        "Someone said they would hurt me if I talked to a teacher.",
        "A classmate threatened me in the hallway.",
        "Someone told me I should be afraid of them.",
        "A student threatened to harm me if I did not cooperate.",
        "Someone sent me a message saying they would hurt me.",
        "A classmate warned me that something bad would happen to me.",
        "Someone threatened me after I refused to do something.",
        "A student said they would attack me after class.",
        "Someone told me they would hurt me if I reported them.",
        "A classmate threatened me over a disagreement.",
        "Someone said they were coming to hurt me.",
        "A student threatened me online.",
        "Someone warned me not to tell anyone.",
        "A classmate told me they planned to attack me.",
        "Someone threatened to beat me after school.",
        "A student said they would hurt me during the next meeting.",
        "Someone sent a threatening message to me.",
        "A classmate threatened me because I disagreed with them.",
        "Someone told me they would make me pay.",
        "A student warned me that they would attack me.",
        "Someone threatened me outside the classroom.",
        "A classmate said they would hurt me if I spoke up.",
        "Someone threatened to harm my friend.",
        "A student told me they were coming after me.",
        "Someone made a direct threat against me.",
        "A classmate threatened me after school.",
        "Someone said they would hurt me if I told anyone.",
        "A student threatened to attack me during a disagreement.",
        "Someone warned me that they would hurt me later.",
        "A classmate sent me a message threatening violence.",
        "Someone told me they planned to hurt me.",
        "A student threatened me because of an argument.",
        "Someone said they would attack me if I reported them.",
        "A classmate warned me not to involve the school.",
        "Someone threatened to hurt me in front of other students.",
        "A student said they would beat me up.",
        "Someone made threats against me through social media.",
        "A classmate threatened me during a school activity.",
        "Someone told me they would hurt me after class.",
        "A student threatened to harm me if I refused.",
        "Someone warned me that I would be attacked.",
        "A classmate told me they were going to hurt me.",
        "Someone sent a message threatening to attack me.",
        "A student threatened me because I spoke up.",
        "Someone said they would hurt me tomorrow.",
        "A classmate threatened me after I reported an incident.",
        "Someone warned me not to tell a teacher.",
        "A student threatened to attack me outside school.",
        "Someone told me they would physically harm me.",
        "A classmate made a threat during an argument.",
        "Someone threatened me in a group chat.",
        "A student said they would come after me later.",
        "Someone threatened to hurt my friend.",
        "A classmate warned me that they would attack me.",
        "Someone told me they would harm me if I complained.",
        "A student made a direct threat against another student.",
        "Someone threatened me after school.",
        "A classmate sent a threatening message.",
        "Someone said they would hurt me if I talked.",
        "A student threatened me in front of classmates.",
        "Someone warned me that they were going to hurt me.",
        "A classmate threatened to attack me later.",
        "Someone made threats against me online.",
        "A student told me they would hurt me if I reported them.",
        "Someone threatened me because of a disagreement.",
        "A classmate told me they would harm me.",
        "Someone threatened to hurt me during school.",
        "A student warned me that they would attack me.",
    ],

    "violence": [
        "A student punched me in the hallway.",
        "A classmate pushed me during an argument.",
        "Someone hit me during lunch.",
        "A student kicked me after class.",
        "A classmate physically attacked me.",
        "Someone shoved me near the school gate.",
        "A student slapped me during an argument.",
        "A classmate grabbed me aggressively.",
        "Someone punched another student in the classroom.",
        "A student pushed me to the ground.",
        "A classmate hit me during a disagreement.",
        "Someone physically assaulted me after school.",
        "A student kicked another student during an argument.",
        "A classmate shoved me in the hallway.",
        "Someone hit me during recess.",
        "A student grabbed my arm aggressively.",
        "A classmate punched me without warning.",
        "Someone pushed me against a wall.",
        "A student physically attacked another student.",
        "A classmate slapped me during an argument.",
        "Someone kicked me while we were outside.",
        "A student shoved me during lunch.",
        "A classmate hit me in the classroom.",
        "Someone grabbed me and pushed me.",
        "A student punched another student after school.",
        "A classmate physically attacked me in the hallway.",
        "Someone shoved me during a disagreement.",
        "A student hit me near the school entrance.",
        "A classmate kicked me during an argument.",
        "Someone pushed me to the ground at school.",
        "A student slapped another student.",
        "A classmate grabbed another student's arm forcefully.",
        "Someone punched me during recess.",
        "A student pushed me while we were arguing.",
        "A classmate hit me several times.",
        "Someone physically attacked me near the classroom.",
        "A student kicked me after an argument.",
        "A classmate shoved me into a desk.",
        "Someone slapped me during a confrontation.",
        "A student punched me in the schoolyard.",
        "A classmate pushed me during lunch.",
        "Someone hit another student in the hallway.",
        "A student grabbed me and would not let go.",
        "A classmate physically assaulted another student.",
        "Someone kicked me during a disagreement.",
        "A student shoved me near the stairs.",
        "A classmate hit me during class.",
        "Someone punched another student outside school.",
        "A student pushed me into the wall.",
        "A classmate slapped me after an argument.",
        "Someone physically attacked me during lunch.",
        "A student kicked another student in the hallway.",
        "A classmate shoved me to the ground.",
        "Someone hit me after school.",
        "A student punched me during an argument.",
        "A classmate grabbed me forcefully.",
        "Someone pushed me while I was walking.",
        "A student physically attacked me near the gate.",
        "A classmate kicked me during a fight.",
        "Someone slapped me during a confrontation.",
        "A student hit me in the hallway.",
        "A classmate pushed another student to the ground.",
        "Someone punched me during school.",
        "A student grabbed my clothing and pulled me.",
        "A classmate physically assaulted me.",
        "Someone kicked me during an argument.",
        "A student shoved me near the classroom.",
        "A classmate hit me during recess.",
        "Someone punched another student in the schoolyard.",
        "A student pushed me against a desk.",
        "A classmate slapped me after we argued.",
        "Someone physically attacked me outside the classroom.",
        "A student kicked me near the school entrance.",
        "A classmate shoved me during lunch.",
        "Someone hit me repeatedly during an altercation.",
        "A student punched another student during a disagreement.",
        "A classmate grabbed me aggressively.",
        "Someone pushed me to the ground.",
        "A student physically assaulted me after class.",
        "A classmate hit me during a school activity.",
        "Someone kicked another student during an argument.",
        "A student shoved me in the hallway.",
    ],
}


# --------------------------------------------------
# Validate new examples
# --------------------------------------------------

print("Loading existing training dataset...")

train_df = pd.read_csv(TRAIN_PATH)

train_df = train_df.dropna(
    subset=["text", "category"]
)

train_df["text"] = (
    train_df["text"]
    .astype(str)
    .str.strip()
)

train_df["category"] = (
    train_df["category"]
    .astype(str)
    .str.strip()
)


print(
    f"Existing training examples: {len(train_df)}"
)


for category in CATEGORIES:

    if category not in NEW_EXAMPLES:
        raise ValueError(
            f"No new examples found for: {category}"
        )

    print(
        f"{category}: "
        f"{len(NEW_EXAMPLES[category])} new examples"
    )


# --------------------------------------------------
# Check for duplicates
# --------------------------------------------------

existing_texts = set(
    train_df["text"].str.lower()
)

new_rows = []

duplicate_count = 0


for category in CATEGORIES:

    for text in NEW_EXAMPLES[category]:

        normalized = text.lower().strip()

        if normalized in existing_texts:
            duplicate_count += 1
            continue

        new_rows.append(
            {
                "text": text,
                "category": category,
            }
        )

        existing_texts.add(normalized)


# --------------------------------------------------
# Add new examples
# --------------------------------------------------

new_df = pd.DataFrame(new_rows)

combined_df = pd.concat(
    [
        train_df[["text", "category"]],
        new_df,
    ],
    ignore_index=True,
)


# --------------------------------------------------
# Shuffle
# --------------------------------------------------

combined_df = combined_df.sample(
    frac=1,
    random_state=42,
).reset_index(drop=True)


# --------------------------------------------------
# Save
# --------------------------------------------------

combined_df.to_csv(
    TRAIN_PATH,
    index=False,
)


# --------------------------------------------------
# Results
# --------------------------------------------------

print("\n" + "=" * 60)
print("TRAINING DATA EXPANSION COMPLETE")
print("=" * 60)

print(
    f"\nOriginal training examples: "
    f"{len(train_df)}"
)

print(
    f"New examples added: "
    f"{len(new_df)}"
)

print("\nNew examples by category:")

print(
    new_df["category"]
    .value_counts()
    .sort_index()
)

print(
    f"Duplicate examples skipped: "
    f"{duplicate_count}"
)

print(
    f"Final training examples: "
    f"{len(combined_df)}"
)

print("\nFinal category distribution:")

print(
    combined_df["category"]
    .value_counts()
    .sort_index()
)

print("\nTraining dataset saved to:")

print(TRAIN_PATH)

print("\nDone!")