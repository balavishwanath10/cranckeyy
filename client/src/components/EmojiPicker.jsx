import React, { useState, useMemo } from 'react';
import { Search, X, Clock, Smile, User, Trees, Utensils, Plane, Trophy, Lightbulb, Hash, Flag, Keyboard } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: Smile,
    emojis: [
      { char: '😀', keywords: 'grinning smile happy face joy' },
      { char: '😃', keywords: 'smiley happy joy grinning smiling' },
      { char: '😄', keywords: 'smile smiling eyes joy happy' },
      { char: '😁', keywords: 'beaming grin teeth smile happy' },
      { char: '😆', keywords: 'laughing squint lol haha happy' },
      { char: '😅', keywords: 'sweat smile relief nervous' },
      { char: '🤣', keywords: 'rofl rolling on the floor laughing hilarious' },
      { char: '😂', keywords: 'joy tears laughing happy cry funny' },
      { char: '🙂', keywords: 'slightly smiling face smile okay' },
      { char: '🙃', keywords: 'upside-down sarcastic silly ironic' },
      { char: '😉', keywords: 'wink playful flirting sly' },
      { char: '😊', keywords: 'blush smile proud warm happy' },
      { char: '😇', keywords: 'halo innocent angel saint' },
      { char: '🥰', keywords: 'love heart face adored romantic' },
      { char: '😍', keywords: 'heart eyes love admire romance' },
      { char: '🤩', keywords: 'star struck excited amazed' },
      { char: '😘', keywords: 'kiss blowing heart love' },
      { char: '😗', keywords: 'kissing gentle kiss whistle' },
      { char: '😚', keywords: 'kiss closed eyes affectionate' },
      { char: '😙', keywords: 'kissing smiling eyes kiss' },
      { char: '😋', keywords: 'yum delicious savouring tongue taste' },
      { char: '😛', keywords: 'tongue silly cheeky playful' },
      { char: '😜', keywords: 'wink tongue playful joke crazy' },
      { char: '🤪', keywords: 'zany goofy crazy wacky wild' },
      { char: '😝', keywords: 'squint tongue silly joke playful' },
      { char: '🤑', keywords: 'money face rich cash dollars' },
      { char: '🤗', keywords: 'hugging hug hands friendly' },
      { char: '🤭', keywords: 'hand over mouth giggle oops secretive' },
      { char: '🤫', keywords: 'shh quiet secret hush silence' },
      { char: '🤔', keywords: 'thinking think ponder wonder hmm' },
      { char: '🤐', keywords: 'zipper mouth silent secret sealed' },
      { char: '🤨', keywords: 'raised eyebrow skeptical suspicious doubt' },
      { char: '😐', keywords: 'neutral blank face emotionless meh' },
      { char: '😑', keywords: 'expressionless poker face impassive flat' },
      { char: '😶', keywords: 'no mouth speechless quiet silent' },
      { char: '😏', keywords: 'smirk flirting sarcastic smug sly' },
      { char: '😒', keywords: 'unamused grumpy displeased annoyed' },
      { char: '🙄', keywords: 'eye roll sarcastic bored annoyance' },
      { char: '😬', keywords: 'grimace nervous awkward oops' },
      { char: '🤥', keywords: 'lying pinocchio liar dishonest nose' },
      { char: '😌', keywords: 'relieved peaceful calm content' },
      { char: '😔', keywords: 'pensive sad depressed down gloomy' },
      { char: '😪', keywords: 'sleepy snot tired droopy' },
      { char: '🤤', keywords: 'drooling hungry crave sleep' },
      { char: '😴', keywords: 'sleeping sleep zzz tired bed' },
      { char: '😷', keywords: 'mask sick medical virus doctor' },
      { char: '🤒', keywords: 'thermometer sick illness ill flu' },
      { char: '🤕', keywords: 'bandage hurt head injured pain' },
      { char: '🤢', keywords: 'nauseated green sick vomit gross' },
      { char: '🤮', keywords: 'vomiting puke barf sick disgust' },
      { char: '🤧', keywords: 'sneezing tissue cold allergy sick' },
      { char: '🥵', keywords: 'hot heat red sweaty panting' },
      { char: '🥶', keywords: 'cold freezing ice blue teeth' },
      { char: '🥴', keywords: 'woozy dizzy drunk tipsy' },
      { char: '😵', keywords: 'dizzy dead eyes overwhelmed' },
      { char: '🤯', keywords: 'mind blown exploding head shocked wow' },
      { char: '🤠', keywords: 'cowboy hat western yeehaw' },
      { char: '🥳', keywords: 'party celebrate celebration horn confetti' },
      { char: '😎', keywords: 'cool sunglasses chill awesome boss' },
      { char: '🤓', keywords: 'nerd glasses smart geek study' },
      { char: '🧐', keywords: 'monocle inspect curious detective' },
      { char: '😕', keywords: 'confused puzzle puzzled unsure' },
      { char: '😟', keywords: 'worried concern anxious nervous' },
      { char: '🙁', keywords: 'slightly frowning frown sad' },
      { char: '😮', keywords: 'open mouth surprise shocked wow' },
      { char: '😯', keywords: 'hushed quiet surprised gasp' },
      { char: '😲', keywords: 'astonished shocked amazed disbelief' },
      { char: '😳', keywords: 'flushed blushing shocked embarrassed' },
      { char: '🥺', keywords: 'pleading puppy eyes please beg cute' },
      { char: '😦', keywords: 'frowning open mouth stunned sad' },
      { char: '😧', keywords: 'anguished troubled pain upset' },
      { char: '😨', keywords: 'fearful scared fright fear panic' },
      { char: '😰', keywords: 'cold sweat anxious nervous panic' },
      { char: '😥', keywords: 'sad relieved disappointed sweat' },
      { char: '😢', keywords: 'crying tear sad weep unhappy' },
      { char: '😭', keywords: 'loudly crying sob tears heartbreak drama' },
      { char: '😱', keywords: 'scream fearful scared horror shocked' },
      { char: '😖', keywords: 'confounded frustration annoyed quivering' },
      { char: '😣', keywords: 'persevering struggle endure stubborn' },
      { char: '😞', keywords: 'disappointed regret sad down' },
      { char: '😓', keywords: 'downcast sweat worried hard work' },
      { char: '😩', keywords: 'weary tired exhausted moan' },
      { char: '😫', keywords: 'tired strained frustrated drained' },
      { char: '🥱', keywords: 'yawn yawning tired bored sleepy' },
      { char: '😤', keywords: 'triumph huff proud angry steam' },
      { char: '😡', keywords: 'pouting rage angry red furious' },
      { char: '😠', keywords: 'angry mad annoyed grumpy irate' },
      { char: '🤬', keywords: 'swearing cussing curse angry symbols' },
      { char: '😈', keywords: 'smiling devil horns evil playful bad' },
      { char: '👿', keywords: 'angry devil horns rage wicked' },
      { char: '💀', keywords: 'skull dead death skeleton dying laughing' },
      { char: '☠️', keywords: 'skull crossbones pirate poison danger' },
      { char: '💩', keywords: 'poop pile turd funny brown' },
      { char: '🤡', keywords: 'clown circus costume scary foolish' },
      { char: '👹', keywords: 'ogre japanese monster red demon' },
      { char: '👺', keywords: 'goblin tengu mask red nose' },
      { char: '👻', keywords: 'ghost spooky halloween spirit boo' },
      { char: '👽', keywords: 'alien ufo extraterrestrial martian' },
      { char: '👾', keywords: 'space invader alien retro game 8bit' },
      { char: '🤖', keywords: 'robot machine droid tech bot' },
      { char: '😺', keywords: 'grinning cat smiley pet feline' },
      { char: '😸', keywords: 'grinning cat smiling eyes happy' },
      { char: '😹', keywords: 'cat tears joy laughing funny' },
      { char: '😻', keywords: 'heart eyes cat love adore feline' },
      { char: '😼', keywords: 'smirking cat sly ironic smile' },
      { char: '😽', keywords: 'kissing cat affection feline' },
      { char: '🙀', keywords: 'weary cat scream shocked horror' },
      { char: '😿', keywords: 'crying cat tear sad weep feline' },
      { char: '😾', keywords: 'pouting cat grumpy angry moody' },
      { char: '💋', keywords: 'kiss mark lipstick romantic love' },
      { char: '💌', keywords: 'love letter mail envelope heart' },
      { char: '💘', keywords: 'heart with arrow cupid love romance' },
      { char: '💝', keywords: 'heart ribbon gift love valentine' },
      { char: '💖', keywords: 'sparkling heart shiny love passion' },
      { char: '💗', keywords: 'growing heart pulse expand love' },
      { char: '💓', keywords: 'beating heart pulse love heartbeat' },
      { char: '💞', keywords: 'revolving hearts love dance affection' },
      { char: '💕', keywords: 'two hearts pink love romance' },
      { char: '💟', keywords: 'heart decoration purple white love' },
      { char: '❣️', keywords: 'heart exclamation mark emphasis love' },
      { char: '💔', keywords: 'broken heart heartbreak break up sad' },
      { char: '❤️', keywords: 'red heart love passion romance favorite' },
      { char: '🧡', keywords: 'orange heart warm care friendly' },
      { char: '💛', keywords: 'yellow heart friendship happiness' },
      { char: '💚', keywords: 'green heart nature jealous healthy' },
      { char: '💙', keywords: 'blue heart loyalty peace trust' },
      { char: '💜', keywords: 'purple heart compassion luxury charm' },
      { char: '🤎', keywords: 'brown heart earth chocolate coffee' },
      { char: '🖤', keywords: 'black heart dark goth sorrow style' },
      { char: '🤍', keywords: 'white heart pure clean peace' },
      { char: '💯', keywords: 'hundred 100 points perfect score pure' },
      { char: '💢', keywords: 'anger symbol mad comic stress vein' },
      { char: '💥', keywords: 'collision boom bang explosion blast' },
      { char: '💫', keywords: 'dizzy star spark swirl shine' },
      { char: '💦', keywords: 'sweat drops water splash rain' },
      { char: '💨', keywords: 'dashing away speed puff dust run fast' },
      { char: '💣', keywords: 'bomb explosion explosive wick' },
      { char: '💬', keywords: 'speech balloon chat conversation talk' },
      { char: '💭', keywords: 'thought balloon dream thinking bubble' },
      { char: '💤', keywords: 'sleeping zzz night bed snore' }
    ]
  },
  {
    id: 'people',
    name: 'People & Gestures',
    icon: User,
    emojis: [
      { char: '👋', keywords: 'wave waving hand hello goodbye greeting' },
      { char: '🤚', keywords: 'raised back of hand stop high five' },
      { char: '🖐️', keywords: 'fingers splayed five hand palm' },
      { char: '✋', keywords: 'raised hand stop high five wait' },
      { char: '🖖', keywords: 'vulcan salute spock star trek live long' },
      { char: '👌', keywords: 'ok okay hand perfect yes fine' },
      { char: '🤌', keywords: 'pinched fingers italian chef gesture what' },
      { char: '🤏', keywords: 'pinching hand small tiny little bit' },
      { char: '✌️', keywords: 'victory hand peace two v sign' },
      { char: '🤞', keywords: 'crossed fingers luck hope wish' },
      { char: '🤟', keywords: 'love you gesture rock sign fingers' },
      { char: '🤘', keywords: 'sign of horns rock metal heavy concert' },
      { char: '🤙', keywords: 'call me hang loose shaka phone' },
      { char: '👈', keywords: 'backhand pointing left index direction' },
      { char: '👉', keywords: 'backhand pointing right index direction' },
      { char: '👆', keywords: 'backhand pointing up index finger above' },
      { char: '👇', keywords: 'backhand pointing down index finger below' },
      { char: '☝️', keywords: 'index pointing up finger remember point' },
      { char: '👍', keywords: 'thumbs up good like approve yes great' },
      { char: '👎', keywords: 'thumbs down bad dislike disapprove no' },
      { char: '✊', keywords: 'raised fist power strength solidarity' },
      { char: '👊', keywords: 'oncoming fist bump punch attack' },
      { char: '🤛', keywords: 'left-facing fist bump knuckles bro' },
      { char: '🤜', keywords: 'right-facing fist bump knuckles bro' },
      { char: '👏', keywords: 'clapping hands applause bravo congrats' },
      { char: '🙌', keywords: 'raising hands celebrate praise hooray' },
      { char: '👐', keywords: 'open hands hug welcome gentle' },
      { char: '🤲', keywords: 'palms up together pray prayer offering' },
      { char: '🤝', keywords: 'handshake deal agree partner greeting' },
      { char: '🙏', keywords: 'folded hands pray please thanks gratitude' },
      { char: '✍️', keywords: 'writing hand write pencil pen exam' },
      { char: '💅', keywords: 'nail polish sassy stylish manicure' },
      { char: '🤳', keywords: 'selfie camera photo phone portrait' },
      { char: '💪', keywords: 'flexed biceps muscle gym strong workout' },
      { char: '🧠', keywords: 'brain mind think smart intelligence' },
      { char: '👀', keywords: 'eyes look watch see staring curious' },
      { char: '👁️', keywords: 'eye look watch sight vision' },
      { char: '👅', keywords: 'tongue mouth taste lick silly' },
      { char: '👄', keywords: 'mouth lips kiss speak teeth' },
      { char: '👶', keywords: 'baby infant child kid youth' },
      { char: '🧒', keywords: 'child kid youth gender neutral' },
      { char: '👦', keywords: 'boy kid male youth young' },
      { char: '👧', keywords: 'girl kid female youth young' },
      { char: '🧑', keywords: 'person adult human someone' },
      { char: '👨', keywords: 'man adult male guy' },
      { char: '👩', keywords: 'woman adult female lady' },
      { char: '🧓', keywords: 'older adult elderly senior' },
      { char: '👴', keywords: 'old man elderly grandfather grandpa' },
      { char: '👵', keywords: 'old woman elderly grandmother grandma' },
      { char: '🤦', keywords: 'facepalm exasperated disbelief oops' },
      { char: '🤷', keywords: 'shrug don know whatever doubt' },
      { char: '🧑‍💻', keywords: 'technologist computer coder programmer dev' },
      { char: '👨‍💻', keywords: 'man technologist developer laptop geek' },
      { char: '👩‍💻', keywords: 'woman technologist developer laptop coder' },
      { char: '🕵️', keywords: 'detective inspector spy secret investigation' },
      { char: '💂', keywords: 'guard soldier protection security' },
      { char: '🥷', keywords: 'ninja assassin stealth fighter warrior' },
      { char: '🤴', keywords: 'prince royal crown king' },
      { char: '👸', keywords: 'princess royal crown queen fairy' },
      { char: '🧙', keywords: 'mage wizard magic sorcerer wand' },
      { char: '🧚', keywords: 'fairy pixie wings fantasy magic' },
      { char: '🧛', keywords: 'vampire dracula fangs spooky halloween' },
      { char: '🧜', keywords: 'merperson mermaid ocean sea tail' },
      { char: '🧞', keywords: 'genie magic lamp wish spirit' },
      { char: '🧟', keywords: 'zombie undead walking dead apocalypse' },
      { char: '🚶', keywords: 'person walking pedestrian stroll step' },
      { char: '🏃', keywords: 'person running marathon sport jogging fast' },
      { char: '💃', keywords: 'woman dancing tango salsa dress celebrate' },
      { char: '🕺', keywords: 'man dancing disco groove club party' },
      { char: '🧗', keywords: 'person climbing rock wall mountain sport' },
      { char: '🧘', keywords: 'person in lotus position yoga meditation calm' }
    ]
  },
  {
    id: 'nature',
    name: 'Animals & Nature',
    icon: Trees,
    emojis: [
      { char: '🐶', keywords: 'dog face pet puppy canine bark' },
      { char: '🐕', keywords: 'dog pet canine animal hound' },
      { char: '🐩', keywords: 'poodle dog pet curly fluffy' },
      { char: '🐺', keywords: 'wolf wild canine predator howl' },
      { char: '🦊', keywords: 'fox face wild sly animal clever' },
      { char: '🐱', keywords: 'cat face pet kitten feline meow' },
      { char: '🐈', keywords: 'cat pet kitten animal feline' },
      { char: '🦁', keywords: 'lion king jungle predator roar mane' },
      { char: '🐯', keywords: 'tiger face wild feline predator cat' },
      { char: '🐅', keywords: 'tiger stripes wild animal predator' },
      { char: '🐆', keywords: 'leopard wild cat spots predator' },
      { char: '🐴', keywords: 'horse face pony animal ride equine' },
      { char: '🐎', keywords: 'horse racehorse equestrian galloping' },
      { char: '🦄', keywords: 'unicorn magic fantasy horn dream' },
      { char: '🦓', keywords: 'zebra stripes safari animal africa' },
      { char: '🦌', keywords: 'deer buck antlers wildlife forest' },
      { char: '🐮', keywords: 'cow face farm beef milk dairy' },
      { char: '🐂', keywords: 'ox bull horned livestock animal' },
      { char: '🐃', keywords: 'water buffalo horns farm animal' },
      { char: '🐄', keywords: 'cow farm milk dairy livestock' },
      { char: '🐷', keywords: 'pig face farm pork snout oink' },
      { char: '🐖', keywords: 'pig farm pork sow hog' },
      { char: '🐗', keywords: 'boar wild pig tusks forest' },
      { char: '🐽', keywords: 'pig nose snout smell pink' },
      { char: '🐏', keywords: 'ram sheep horns farm male' },
      { char: '🐑', keywords: 'ewe sheep wool fluffy lamb' },
      { char: '🐐', keywords: 'goat farm animal horns beard' },
      { char: '🐪', keywords: 'camel dromedary desert hump animal' },
      { char: '🐫', keywords: 'two-hump camel bactrian desert' },
      { char: '🦙', keywords: 'llama alpaca wool andes farm' },
      { char: '🦒', keywords: 'giraffe tall neck spots safari' },
      { char: '🐘', keywords: 'elephant trunk giant tusks animal' },
      { char: '🦏', keywords: 'rhinoceros horn wildlife safari animal' },
      { char: '🦛', keywords: 'hippopotamus water wildlife safari heavy' },
      { char: '🐭', keywords: 'mouse face rodent pet small cheese' },
      { char: '🐁', keywords: 'mouse rodent animal white lab' },
      { char: '🐀', keywords: 'rat rodent dirty street pest' },
      { char: '🐹', keywords: 'hamster face pet rodent cute fluffy' },
      { char: '🐰', keywords: 'rabbit face pet bunny easter carrot' },
      { char: '🐇', keywords: 'rabbit bunny animal pet nature' },
      { char: '🐿️', keywords: 'chipmunk squirrel rodent acorn nut' },
      { char: '🦔', keywords: 'hedgehog spikes needles prickly cute' },
      { char: '🦇', keywords: 'bat vampire nocturnal cave fly' },
      { char: '🐻', keywords: 'bear face wild forest predator teddy' },
      { char: '🐻‍❄️', keywords: 'polar bear white arctic snow ice' },
      { char: '🐨', keywords: 'koala bear australia eucalyptus cute' },
      { char: '🐼', keywords: 'panda bear bamboo china cute black white' },
      { char: '🦥', keywords: 'sloth slow lazy tree hanging chill' },
      { char: '🦦', keywords: 'otter water cute swimming playful' },
      { char: '🦨', keywords: 'skunk stink smell stripe odor' },
      { char: '🦘', keywords: 'kangaroo joey australia pouch jump' },
      { char: '🐾', keywords: 'paw prints tracks animal footsteps' },
      { char: '🦃', keywords: 'turkey bird thanksgiving feast gobble' },
      { char: '🐔', keywords: 'chicken bird farm hen poultry' },
      { char: '🐓', keywords: 'rooster chicken bird crow morning' },
      { char: '🐣', keywords: 'hatching chick egg born baby' },
      { char: '🐤', keywords: 'baby chick bird yellow cute' },
      { char: '🐥', keywords: 'front-facing baby chick yellow cute' },
      { char: '🐦', keywords: 'bird fly nature tweet animal' },
      { char: '🐧', keywords: 'penguin antarctic bird ice tuxedo' },
      { char: '🕊️', keywords: 'dove peace olive bird holy' },
      { char: '🦅', keywords: 'eagle bird prey majestic fly raptor' },
      { char: '🦆', keywords: 'duck waterfowl quack bird pond' },
      { char: '🦢', keywords: 'swan graceful water bird pond' },
      { char: '🦉', keywords: 'owl bird wisdom nocturnal night wise' },
      { char: '🦩', keywords: 'flamingo pink tropical bird balance' },
      { char: '🦚', keywords: 'peacock feathers colorful majestic' },
      { char: '🦜', keywords: 'parrot bird pirate tropical color talk' },
      { char: '🐸', keywords: 'frog toad ribbit amphibian green' },
      { char: '🐊', keywords: 'crocodile alligator reptile swamp tooth' },
      { char: '🐢', keywords: 'turtle tortoise slow shell reptile' },
      { char: '🦎', keywords: 'lizard gecko reptile nature' },
      { char: '🐍', keywords: 'snake serpent reptile hiss venom python' },
      { char: '🐲', keywords: 'dragon face mythical fantasy fire monster' },
      { char: '🐉', keywords: 'dragon mythical fairytale fantasy fire' },
      { char: '🦕', keywords: 'sauropod dinosaur dino ancient jurassic' },
      { char: '🦖', keywords: 't-rex tyrannosaurus rex dinosaur predator' },
      { char: '🐳', keywords: 'spouting whale ocean water sea blowhole' },
      { char: '🐋', keywords: 'whale ocean sea sea monster large' },
      { char: '🐬', keywords: 'dolphin ocean sea smart mammal' },
      { char: '🦭', keywords: 'seal ocean arctic mammal water' },
      { char: '🐟', keywords: 'fish ocean swim water animal sea' },
      { char: '🐠', keywords: 'tropical fish aquarium reef colorful' },
      { char: '🐡', keywords: 'blowfish pufferfish spiky venom sea' },
      { char: '🦈', keywords: 'shark predator teeth jaws danger ocean' },
      { char: '🐙', keywords: 'octopus tentacles sea sea monster ocean' },
      { char: '🐚', keywords: 'spiral shell seashell beach ocean snail' },
      { char: '🐌', keywords: 'snail slow shell slime garden pest' },
      { char: '🦋', keywords: 'butterfly insect colorful wings fly pretty' },
      { char: '🐛', keywords: 'bug caterpillar insect larva nature' },
      { char: '🐜', keywords: 'ant insect colony worker tiny small' },
      { char: '🐝', keywords: 'honeybee bee honey sting insect buzz' },
      { char: '🐞', keywords: 'lady beetle ladybug insect spots luck' },
      { char: '🕷️', keywords: 'spider web arachnid eight creepy scary' },
      { char: '🕸️', keywords: 'spider web cobweb creepy trap thread' },
      { char: '🦂', keywords: 'scorpion venom pinch sting desert' },
      { char: '💐', keywords: 'bouquet flowers romance gift valentine' },
      { char: '🌸', keywords: 'cherry blossom sakura flower spring japan' },
      { char: '🌹', keywords: 'rose red flower love romance valentine' },
      { char: '🥀', keywords: 'wilted flower dead sad romantic decay' },
      { char: '🌺', keywords: 'hibiscus flower tropical aloha hawaii' },
      { char: '🌻', keywords: 'sunflower yellow sunny summer plant' },
      { char: '🌼', keywords: 'blossom flower yellow daisy floral' },
      { char: '🌷', keywords: 'tulip flower spring netherlands garden' },
      { char: '🌱', keywords: 'seedling sprout plant grow baby green' },
      { char: '🪴', keywords: 'potted plant houseplant greenery garden' },
      { char: '🌲', keywords: 'evergreen tree pine conifer forest nature' },
      { char: '🌳', keywords: 'deciduous tree leaves green woods' },
      { char: '🌴', keywords: 'palm tree beach tropical island coconut' },
      { char: '🌵', keywords: 'cactus desert plant spiky succulent dry' },
      { char: '🍀', keywords: 'four leaf clover lucky fortune irish' },
      { char: '🍁', keywords: 'maple leaf autumn fall canada season' },
      { char: '🍂', keywords: 'fallen leaf leaves autumn fall wind' },
      { char: '🍃', keywords: 'leaf fluttering in wind green nature breeze' },
      { char: '✨', keywords: 'sparkles stars magic shiny glitter clean' },
      { char: '⭐', keywords: 'star gold favorite rate rating' },
      { char: '🌟', keywords: 'glowing star shine sparkle bright' },
      { char: '🔥', keywords: 'fire flame hot lit burning blaze energy' },
      { char: '🌈', keywords: 'rainbow colors weather pride sky beautiful' },
      { char: '☀️', keywords: 'sun sunny bright warm weather daylight' },
      { char: '🌙', keywords: 'crescent moon night sleep lunar dream' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: Utensils,
    emojis: [
      { char: '🍇', keywords: 'grapes fruit wine purple vine snack' },
      { char: '🍉', keywords: 'watermelon fruit summer sweet melon' },
      { char: '🍊', keywords: 'tangerine orange citrus vitamin c fruit' },
      { char: '🍋', keywords: 'lemon sour citrus yellow fruit lemonade' },
      { char: '🍌', keywords: 'banana fruit monkey yellow potassium' },
      { char: '🍍', keywords: 'pineapple tropical fruit sweet spike' },
      { char: '🥭', keywords: 'mango tropical fruit sweet delicious' },
      { char: '🍎', keywords: 'red apple fruit healthy teacher crisp' },
      { char: '🍏', keywords: 'green apple granny smith tart healthy' },
      { char: '🍐', keywords: 'pear fruit green sweet juicy' },
      { char: '🍑', keywords: 'peach fruit sweet butt fuzzy pink' },
      { char: '🍒', keywords: 'cherries fruit red sweet berry pair' },
      { char: '🍓', keywords: 'strawberry berry fruit red sweet summer' },
      { char: '🫐', keywords: 'blueberries berry fruit healthy superfood' },
      { char: '🥝', keywords: 'kiwi fruit fuzzy green new zealand' },
      { char: '🍅', keywords: 'tomato fruit vegetable red salad sauce' },
      { char: '🥥', keywords: 'coconut tropical palm water nut' },
      { char: '🥑', keywords: 'avocado guacamole healthy green toast' },
      { char: '🍆', keywords: 'eggplant aubergine vegetable purple' },
      { char: '🥔', keywords: 'potato vegetable carb fry baked spud' },
      { char: '🥕', keywords: 'carrot vegetable orange healthy vision' },
      { char: '🌽', keywords: 'ear of corn cob sweet maize grain' },
      { char: '🌶️', keywords: 'hot pepper chili spicy seasoning heat' },
      { char: '🫑', keywords: 'bell pepper capsicum green veggie crisp' },
      { char: '🥒', keywords: 'cucumber pickle vegetable salad cool' },
      { char: '🥬', keywords: 'leafy green lettuce salad cabbage kale' },
      { char: '🥦', keywords: 'broccoli vegetable green healthy tree' },
      { char: '🧄', keywords: 'garlic clove seasoning pungent vampire' },
      { char: '🧅', keywords: 'onion vegetable cooking tears culinary' },
      { char: '🍄', keywords: 'mushroom fungus toadstool forest cooking' },
      { char: '🥜', keywords: 'peanuts nut snack roasted butter' },
      { char: '🍞', keywords: 'bread loaf bakery toast wheat carbs' },
      { char: '🥐', keywords: 'croissant bakery pastry french butter' },
      { char: '🥖', keywords: 'baguette bread french bakery crust' },
      { char: '🥨', keywords: 'pretzel snack salt knot bakery' },
      { char: '🥯', keywords: 'bagel bread bakery breakfast cream cheese' },
      { char: '🥞', keywords: 'pancakes breakfast syrup butter hotcake' },
      { char: '🧇', keywords: 'waffle breakfast grid syrup butter' },
      { char: '🧀', keywords: 'cheese wedge cheddar dairy swiss yellow' },
      { char: '🍖', keywords: 'meat on bone anime drumstick beef bbq' },
      { char: '🍗', keywords: 'poultry leg chicken fried drumstick dinner' },
      { char: '🥩', keywords: 'cut of meat steak beef raw pork chop' },
      { char: '🥓', keywords: 'bacon pork breakfast crispy strip' },
      { char: '🍔', keywords: 'hamburger burger fast food beef bun cheese' },
      { char: '🍟', keywords: 'french fries potato fast food snack salty' },
      { char: '🍕', keywords: 'pizza slice pepperoni cheese italian fast food' },
      { char: '🌭', keywords: 'hot dog frankfurter sausage mustard bun' },
      { char: '🥪', keywords: 'sandwich lunch deli sub bread snack' },
      { char: '🌮', keywords: 'taco mexican food shell beef lettuce' },
      { char: '🌯', keywords: 'burrito wrap mexican food roll flour' },
      { char: '🥙', keywords: 'stuffed flatbread kebab pita falafel' },
      { char: '🧆', keywords: 'falafel middle eastern chickpea fry vegan' },
      { char: '🍳', keywords: 'cooking fried egg breakfast skillet pan' },
      { char: '🥘', keywords: 'shallow pan of food paella curry casserole' },
      { char: '🍲', keywords: 'pot of food stew soup hot bowl' },
      { char: '🥣', keywords: 'bowl with spoon soup cereal oatmeal' },
      { char: '🥗', keywords: 'green salad healthy veggies diet lettuce' },
      { char: '🍿', keywords: 'popcorn movie snack cinema butter corn' },
      { char: '🧈', keywords: 'butter dairy spread yellow cooking' },
      { char: '🧂', keywords: 'salt shaker seasoning culinary sodium' },
      { char: '🥫', keywords: 'canned food tin soup pantry beans' },
      { char: '🍱', keywords: 'bento box japanese lunch meal sushi' },
      { char: '🍘', keywords: 'rice cracker japanese snack seaweed' },
      { char: '🍙', keywords: 'rice ball onigiri japanese seaweed nori' },
      { char: '🍚', keywords: 'cooked rice bowl staple grain asian' },
      { char: '🍛', keywords: 'curry rice indian spicy dinner delicious' },
      { char: '🍜', keywords: 'steaming bowl ramen noodles soup broth' },
      { char: '🍝', keywords: 'spaghetti pasta italian tomato sauce noodle' },
      { char: '🍠', keywords: 'roasted sweet potato yam snack purple' },
      { char: '🍢', keywords: 'oden skewer seafood broth japanese' },
      { char: '🍣', keywords: 'sushi raw fish japanese salmon roll' },
      { char: '🍤', keywords: 'fried shrimp tempura seafood crunchy' },
      { char: '🍥', keywords: 'fish cake narutomaki ramen swirl pink' },
      { char: '🥟', keywords: 'dumpling gyoza dim sum potsticker asian' },
      { char: '🥠', keywords: 'fortune cookie dessert prophecy chinese' },
      { char: '🥡', keywords: 'takeout box chinese fast food container' },
      { char: '🍦', keywords: 'soft ice cream cone vanilla swirl dessert' },
      { char: '🍧', keywords: 'shaved ice dessert sweet syrup snow' },
      { char: '🍨', keywords: 'ice cream dessert bowl scoop sweet' },
      { char: '🍩', keywords: 'doughnut donut dessert glaze sweet pastry' },
      { char: '🍪', keywords: 'cookie biscuit chocolate chip snack sweet' },
      { char: '🎂', keywords: 'birthday cake celebration candles party dessert' },
      { char: '🍰', keywords: 'shortcake cake slice strawberry dessert sweet' },
      { char: '🧁', keywords: 'cupcake muffin dessert frosting sprinkles' },
      { char: '🥧', keywords: 'pie dessert bakery apple crust pastry' },
      { char: '🍫', keywords: 'chocolate bar candy sweet cocoa dessert' },
      { char: '🍬', keywords: 'candy sweet sugar wrapper treat' },
      { char: '🍭', keywords: 'lollipop sweet candy swirl treat stick' },
      { char: '🍮', keywords: 'custard pudding caramel flan dessert' },
      { char: '🍯', keywords: 'honey pot sweet bee bear breakfast' },
      { char: '🍼', keywords: 'baby bottle milk infant drink feed' },
      { char: '🥛', keywords: 'glass of milk dairy drink calcium beverage' },
      { char: '☕', keywords: 'hot beverage coffee tea cup caffeine morning' },
      { char: '🫖', keywords: 'teapot tea kettle brewing ceramic' },
      { char: '🍵', keywords: 'teacup without handle matcha green tea' },
      { char: '🍶', keywords: 'sake japanese drink ceramic bottle cup' },
      { char: '🍾', keywords: 'bottle with popping cork champagne wine party' },
      { char: '🍷', keywords: 'wine glass red alcohol drink grape' },
      { char: '🍸', keywords: 'cocktail glass martini alcohol drink bar olive' },
      { char: '🍹', keywords: 'tropical drink cocktail summer beach alcohol' },
      { char: '🍺', keywords: 'beer mug alcohol pub froth cold drink' },
      { char: '🍻', keywords: 'clinking beer mugs cheers alcohol party pub' },
      { char: '🥂', keywords: 'clinking glasses toast cheers champagne celebration' },
      { char: '🥃', keywords: 'tumbler glass whiskey scotch bourbon liquor' },
      { char: '🥤', keywords: 'cup with straw soda soft drink beverage juice' },
      { char: '🧋', keywords: 'bubble tea boba milk drink tapioca pearls' },
      { char: '🧃', keywords: 'beverage box juice straw carton sweet' }
    ]
  },
  {
    id: 'travel',
    name: 'Travel & Places',
    icon: Plane,
    emojis: [
      { char: '🚗', keywords: 'car automobile red vehicle drive travel' },
      { char: '🚕', keywords: 'taxi cab vehicle transport fare yellow' },
      { char: '🚙', keywords: 'sport utility vehicle suv car transport' },
      { char: '🚌', keywords: 'bus public transport transit commute' },
      { char: '🚎', keywords: 'trolleybus transit electric cable bus' },
      { char: '🏎️', keywords: 'racing car race f1 formula fast drive' },
      { char: '🚓', keywords: 'police car siren cops law emergency' },
      { char: '🚑', keywords: 'ambulance emergency medical paramedic hospital' },
      { char: '🚒', keywords: 'fire engine truck firefighter emergency blaze' },
      { char: '🚐', keywords: 'minibus van camper transport travel' },
      { char: '🛻', keywords: 'pickup truck transport vehicle utility' },
      { char: '🚚', keywords: 'delivery truck cargo logistics package' },
      { char: '🚛', keywords: 'articulated lorry semi truck freight haul' },
      { char: '🚜', keywords: 'tractor agriculture farm harvest heavy' },
      { char: '🛴', keywords: 'kick scooter transport wheel ride' },
      { char: '🚲', keywords: 'bicycle bike cycling wheel pedal ride' },
      { char: '🛵', keywords: 'motor scooter moped vespa transport' },
      { char: '🏍️', keywords: 'motorcycle motorbike speed road ride' },
      { char: '🚨', keywords: 'police car light siren flashing emergency red' },
      { char: '🚥', keywords: 'horizontal traffic light signal stop go' },
      { char: '🚦', keywords: 'vertical traffic light signal stop go' },
      { char: '✈️', keywords: 'airplane flight airport trip travel vacay' },
      { char: '🛫', keywords: 'airplane departure takeoff flight fly travel' },
      { char: '🛬', keywords: 'airplane arrival landing airport arrive' },
      { char: '🚀', keywords: 'rocket space launch shuttle speed orbit' },
      { char: '🛸', keywords: 'flying saucer ufo alien extraterrestrial' },
      { char: '🚁', keywords: 'helicopter chopper aircraft rotor transport' },
      { char: '🛶', keywords: 'canoe kayak paddle river boat' },
      { char: '⛵', keywords: 'sailboat yacht ocean wind sail sea' },
      { char: '🚤', keywords: 'speedboat motorboat water fast power' },
      { char: '🛳️', keywords: 'passenger ship cruise liner vessel travel' },
      { char: '🚢', keywords: 'ship boat vessel freight sea water' },
      { char: '⚓', keywords: 'anchor marine navy boat port dock' },
      { char: '⛽', keywords: 'fuel pump gas station petrol refill energy' },
      { char: '🗺️', keywords: 'world map geography travel atlas explore' },
      { char: '🗽', keywords: 'statue of liberty new york usa monument' },
      { char: '🗼', keywords: 'tokyo tower japan landmark steel antenna' },
      { char: '🏰', keywords: 'castle fortress royalty fairy tale stone' },
      { char: '🏯', keywords: 'japanese castle fortress pagoda heritage' },
      { char: '🎡', keywords: 'ferris wheel amusement park fair carnival ride' },
      { char: '🎢', keywords: 'roller coaster theme park thrills ride fair' },
      { char: '⛺', keywords: 'tent camping outdoor hike wilderness camp' },
      { char: '🏕️', keywords: 'camping outdoor wilderness trees campfire' },
      { char: '🏖️', keywords: 'beach with umbrella sand ocean vacation sea' },
      { char: '🏜️', keywords: 'desert arid cactus dunes dry sand' },
      { char: '🏝️', keywords: 'desert island tropical beach ocean paradise' },
      { char: '🌋', keywords: 'volcano lava eruption eruption mountain' },
      { char: '🗻', keywords: 'mount fuji mountain japan snow peak' },
      { char: '🏠', keywords: 'house home building residence living' },
      { char: '🏡', keywords: 'house with garden home family living yard' },
      { char: '🏢', keywords: 'office building corporate skyscraper business work' }
    ]
  },
  {
    id: 'activities',
    name: 'Activities & Sports',
    icon: Trophy,
    emojis: [
      { char: '⚽', keywords: 'soccer ball football match sport pitch goal' },
      { char: '🏀', keywords: 'basketball sport hoop dunk court ball' },
      { char: '🏈', keywords: 'american football gridiron touchdown ball' },
      { char: '⚾', keywords: 'baseball ball strike home run pitch sport' },
      { char: '🥎', keywords: 'softball ball underhand pitch sport' },
      { char: '🎾', keywords: 'tennis racket ball court match deuce' },
      { char: '🏐', keywords: 'volleyball ball beach court spike serve' },
      { char: '🏉', keywords: 'rugby football match scrum try tackle' },
      { char: '🎱', keywords: 'pool 8 ball billiards game cue tavern' },
      { char: '🏓', keywords: 'ping pong table tennis paddle ball smash' },
      { char: '🏸', keywords: 'badminton racket shuttlecock bird sport' },
      { char: '🏒', keywords: 'ice hockey puck stick rink winter game' },
      { char: '🏑', keywords: 'field hockey stick ball turf outdoor' },
      { char: '🏏', keywords: 'cricket bat ball wicket match over innings' },
      { char: '⛳', keywords: 'flag in hole golf green course club par' },
      { char: '🎯', keywords: 'bullseye direct hit dart target aim focus' },
      { char: '🎮', keywords: 'video game gamepad controller console play' },
      { char: '🎲', keywords: 'game die dice roll casino boardgame luck' },
      { char: '♟️', keywords: 'chess pawn game strategy king queen board' },
      { char: '🏆', keywords: 'trophy winner champion victory cup award first' },
      { char: '🥇', keywords: '1st place medal gold winner champion' },
      { char: '🥈', keywords: '2nd place medal silver second runner up' },
      { char: '🥉', keywords: '3rd place medal bronze third place' },
      { char: '🏅', keywords: 'sports medal military honor winner award' },
      { char: '🎖️', keywords: 'military medal honor decoration bravery' },
      { char: '🎗️', keywords: 'reminder ribbon awareness support cause' },
      { char: '🎫', keywords: 'ticket admission concert cinema movie event' },
      { char: '🎟️', keywords: 'admission tickets stub cinema show fair' },
      { char: '🎪', keywords: 'circus tent show carnival performance big top' },
      { char: '🎨', keywords: 'artist palette painting art color draw brush' },
      { char: '🎬', keywords: 'clapper board film movie hollywood cinema action' },
      { char: '🎤', keywords: 'microphone mic singing karaoke audio vocal' },
      { char: '🎧', keywords: 'headphone music listen audio podcast beats' },
      { char: '🎼', keywords: 'musical score sheet notes clef harmony tune' },
      { char: '🎹', keywords: 'musical keyboard piano keys synth melodies' },
      { char: '🥁', keywords: 'drum sticks rhythm beat percussion music' },
      { char: '🎷', keywords: 'saxophone jazz brass wind instrument blues' },
      { char: '🎺', keywords: 'trumpet brass horn jazz bugle fanfare' },
      { char: '🎸', keywords: 'guitar acoustic electric rock instrument chord' },
      { char: '🎻', keywords: 'violin string instrument orchestra classical' },
      { char: '🧩', keywords: 'puzzle piece jigsaw solve problem mystery fit' },
      { char: '🎳', keywords: 'bowling strike pins ball alley game spare' }
    ]
  },
  {
    id: 'objects',
    name: 'Objects & Tech',
    icon: Lightbulb,
    emojis: [
      { char: '📱', keywords: 'mobile phone smartphone cell apple android screen' },
      { char: '💻', keywords: 'laptop computer pc tech screen macbook dev' },
      { char: '🖥️', keywords: 'desktop computer monitor display pc workstation' },
      { char: '⌨️', keywords: 'keyboard typing keys input typing coding text' },
      { char: '🖱️', keywords: 'computer mouse click cursor scroll tech' },
      { char: '🖨️', keywords: 'printer paper office scan copy printout' },
      { char: '📷', keywords: 'camera photo picture shutter shoot flash' },
      { char: '📸', keywords: 'camera with flash snapshot photo shoot picture' },
      { char: '📹', keywords: 'video camera recorder camcorder tape record' },
      { char: '📺', keywords: 'television tv screen broadcast stream shows' },
      { char: '📻', keywords: 'radio broadcast fm am tuning audio podcast' },
      { char: '⏱️', keywords: 'stopwatch timer clock measure second speed' },
      { char: '⏰', keywords: 'alarm clock morning wake up time ring alert' },
      { char: '🕰️', keywords: 'mantelpiece clock vintage antique time tick' },
      { char: '⌛', keywords: 'hourglass done sand timer finish end time' },
      { char: '⏳', keywords: 'hourglass not done loading sand running time' },
      { char: '🔋', keywords: 'battery power energy charge full electric' },
      { char: '🔌', keywords: 'electric plug socket outlet power cable tech' },
      { char: '💡', keywords: 'light bulb idea inspiration smart bright invent' },
      { char: '🔦', keywords: 'flashlight torch dark light beam search' },
      { char: '🕯️', keywords: 'candle flame wax fire light romantic scent' },
      { char: '💸', keywords: 'money with wings flying away cash spend bill' },
      { char: '💵', keywords: 'dollar banknote cash money wealth currency' },
      { char: '🪙', keywords: 'coin money gold silver currency change' },
      { char: '💰', keywords: 'money bag dollar rich wealth jackpot cash' },
      { char: '💳', keywords: 'credit card payment debit buy purchase bank' },
      { char: '💎', keywords: 'gem stone diamond jewel precious expensive crystal' },
      { char: '🔧', keywords: 'wrench tool spanner fix repair mechanics' },
      { char: '🔨', keywords: 'hammer tool build hit nail construction' },
      { char: '🛠️', keywords: 'hammer and wrench tools fix maintenance settings' },
      { char: '⚙️', keywords: 'gear cog settings options mechanism engineer' },
      { char: '🔒', keywords: 'locked padlock security safe protect closed' },
      { char: '🔓', keywords: 'unlocked padlock open access freedom password' },
      { char: '🔑', keywords: 'key password secret access login unlock door' },
      { char: '🗝️', keywords: 'old key vintage antique secret password mystery' },
      { char: '🔔', keywords: 'bell ring notification alert sound alarm' },
      { char: '🔕', keywords: 'bell with slash mute silent silent off quiet' },
      { char: '📢', keywords: 'loudspeaker bullhorn announcement public shout' },
      { char: '📣', keywords: 'megaphone cheering shout cheer promote marketing' },
      { char: '🔍', keywords: 'magnifying glass search find look zoom query' },
      { char: '🔎', keywords: 'magnifying glass tilted right find search inspect' },
      { char: '📦', keywords: 'package parcel box delivery shipment cardboard' },
      { char: '✉️', keywords: 'envelope email letter mail message post' },
      { char: '📩', keywords: 'envelope with arrow incoming message inbox letter' },
      { char: '📤', keywords: 'outbox tray sent email outgoing dispatch' },
      { char: '📥', keywords: 'inbox tray received email incoming mail' },
      { char: '📄', keywords: 'page facing up document paper text write report' },
      { char: '📊', keywords: 'bar chart graph statistics analytics data metrics' },
      { char: '📈', keywords: 'chart increasing chart graph trend profit growth' },
      { char: '📉', keywords: 'chart decreasing chart graph loss decline crisis' },
      { char: '📌', keywords: 'pushpin thumbtack mark note pinned corkboard' },
      { char: '📍', keywords: 'round pushpin location map pin place point' },
      { char: '📎', keywords: 'paperclip attach attachment stationery link' },
      { char: '🔗', keywords: 'link hyperlink chain connection url connect' },
      { char: '📝', keywords: 'memo pencil note writing list draft' },
      { char: '✏️', keywords: 'pencil write draw edit draft stationery' }
    ]
  },
  {
    id: 'symbols',
    name: 'Symbols',
    icon: Hash,
    emojis: [
      { char: '⚡', keywords: 'high voltage electricity lightning storm thunder fast' },
      { char: '🔥', keywords: 'fire flame lit hot burning trend' },
      { char: '✨', keywords: 'sparkles shiny magical special stars clean' },
      { char: '💫', keywords: 'dizzy star spark swirl shine' },
      { char: '💥', keywords: 'collision boom blast impact explosion' },
      { char: '❤️', keywords: 'red heart love passion romance favorite' },
      { char: '💔', keywords: 'broken heart sad grief tears split pain' },
      { char: '✅', keywords: 'check mark button verify tick done correct pass' },
      { char: '❌', keywords: 'cross mark x cancel wrong error fail deny' },
      { char: '❓', keywords: 'question mark red query doubt ask what' },
      { char: '❗', keywords: 'exclamation mark red alert warning caution notice' },
      { char: '⚠️', keywords: 'warning sign caution hazard alert danger' },
      { char: '⛔', keywords: 'no entry stop forbidden denied prohibited' },
      { char: '🚫', keywords: 'prohibited ban no cancel forbidden forbidden' },
      { char: '🎉', keywords: 'party popper celebrate celebration tadas yay win' },
      { char: '🎊', keywords: 'confetti ball celebration party congratulations' },
      { char: '🎁', keywords: 'wrapped gift present celebration birthday ribbon' },
      { char: '🎈', keywords: 'balloon red party celebration birthday float' },
      { char: '🔮', keywords: 'crystal ball magic fortune prediction future' },
      { char: '🧿', keywords: 'nazar amulet evil eye protection charm ward' },
      { char: '🎯', keywords: 'direct hit bullseye target goal aim success' },
      { char: '🎵', keywords: 'musical note sound melody song sing' },
      { char: '🎶', keywords: 'musical notes melody song tunes music' },
      { char: '➕', keywords: 'plus add math positive increase' },
      { char: '➖', keywords: 'minus subtract math negative decrease' },
      { char: '✖️', keywords: 'multiply cross times math cancel' },
      { char: '➗', keywords: 'divide division math calculate split' },
      { char: '♾️', keywords: 'infinity eternal endless loop forever' },
      { char: '💲', keywords: 'heavy dollar sign cash currency money value' },
      { char: '💱', keywords: 'currency exchange money convert trade bank' },
      { char: '©️', keywords: 'copyright symbol legal rights intellectual' },
      { char: '®️', keywords: 'registered trademark legal symbol brand' },
      { char: '™️', keywords: 'trade mark brand trademark legal' }
    ]
  },
  {
    id: 'flags',
    name: 'Flags',
    icon: Flag,
    emojis: [
      { char: '🏁', keywords: 'chequered flag finish line race start motor' },
      { char: '🚩', keywords: 'triangular flag red flag warning marker post' },
      { char: '🎌', keywords: 'crossed flags celebration japan national event' },
      { char: '🏴', keywords: 'black flag waving dark pirate shadow' },
      { char: '🏳️', keywords: 'white flag surrender peace truce waving' },
      { char: '🏳️‍🌈', keywords: 'rainbow flag pride lgbtq diversity love' },
      { char: '🏳️‍⚧️', keywords: 'transgender flag pride trans awareness' },
      { char: '🏴‍☠️', keywords: 'pirate flag skull crossbones jolly roger sea' },
      { char: '🇮🇳', keywords: 'india flag tricolor indian bharat delhi' },
      { char: '🇺🇸', keywords: 'united states usa flag america stars stripes' },
      { char: '🇬🇧', keywords: 'united kingdom uk flag britain union jack london' },
      { char: '🇨🇦', keywords: 'canada flag maple leaf canadian toronto' },
      { char: '🇦🇺', keywords: 'australia flag aussie oceania sydney' },
      { char: '🇯🇵', keywords: 'japan flag rising sun japanese tokyo' },
      { char: '🇩🇪', keywords: 'germany flag german deutschland berlin' },
      { char: '🇫🇷', keywords: 'france flag french tricolor paris' },
      { char: '🇮🇹', keywords: 'italy flag italian tricolor rome' },
      { char: '🇪🇸', keywords: 'spain flag spanish madrid' },
      { char: '🇧🇷', keywords: 'brazil flag brazilian rio' },
      { char: '🇷🇺', keywords: 'russia flag russian moscow' },
      { char: '🇨🇳', keywords: 'china flag chinese beijing' },
      { char: '🇰🇷', keywords: 'south korea flag korean seoul' },
      { char: '🇲🇽', keywords: 'mexico flag mexican' },
      { char: '🇦🇪', keywords: 'united arab emirates uae flag dubai' },
      { char: '🇸🇦', keywords: 'saudi arabia flag' },
      { char: '🇿🇦', keywords: 'south africa flag' },
      { char: '🇨🇭', keywords: 'switzerland flag swiss cross' },
      { char: '🇸🇪', keywords: 'sweden flag swedish' },
      { char: '🇳🇴', keywords: 'norway flag norwegian' },
      { char: '🇳🇱', keywords: 'netherlands flag dutch amsterdam' },
      { char: '🇸🇬', keywords: 'singapore flag lion city' }
    ]
  }
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemHintVisible, setSystemHintVisible] = useState(false);

  // Load recent emojis from localStorage
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const saved = localStorage.getItem('cranckeyy_recent_emojis');
      return saved ? JSON.parse(saved) : ['😊', '❤️', '🔥', '✨', '👍', '😂', '🎉', '⚡'];
    } catch {
      return ['😊', '❤️', '🔥', '✨', '👍', '😂', '🎉', '⚡'];
    }
  });

  const handleSelect = (emojiChar) => {
    onSelectEmoji(emojiChar);
    // Add to recent emojis
    const updated = [emojiChar, ...recentEmojis.filter(e => e !== emojiChar)].slice(0, 16);
    setRecentEmojis(updated);
    try {
      localStorage.setItem('cranckeyy_recent_emojis', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Search filtered results
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results = [];
    EMOJI_CATEGORIES.forEach(cat => {
      cat.emojis.forEach(item => {
        if (item.char.includes(q) || item.keywords.includes(q)) {
          results.push(item);
        }
      });
    });
    return results;
  }, [searchQuery]);

  const activeCategoryData = useMemo(() => {
    return EMOJI_CATEGORIES.find(c => c.id === activeCategory);
  }, [activeCategory]);

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-zinc-950/95 border border-zinc-700/80 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 text-zinc-200">
      
      {/* Header with Search and System Panel Trigger */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        <div className="flex items-center justify-between gap-2">
          
          {/* Search Input */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search all emojis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-500 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none transition"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-400 hover:text-zinc-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Native System Emoji Shortcut Button */}
          <button
            type="button"
            onClick={() => setSystemHintVisible(prev => !prev)}
            title="System Emoji Keyboard Shortcut"
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition shrink-0"
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Win + .</span>
          </button>

          {/* Close button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* System Keyboard Shortcut Popup Banner */}
        {systemHintVisible && (
          <div className="p-2.5 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-[11px] text-zinc-300 space-y-1 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                Native System Emoji Palette
              </span>
              <button
                type="button"
                onClick={() => setSystemHintVisible(false)}
                className="text-zinc-500 hover:text-zinc-300 text-[10px]"
              >
                Dismiss
              </button>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[10px]">
              You can also open your operating system's built-in emoji drawer directly anytime by pressing:
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5 font-mono text-[10px]">
              <span className="bg-zinc-950 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-bold">
                Windows: Win + . (or Win + ;)
              </span>
              <span className="bg-zinc-950 border border-zinc-700 px-2 py-0.5 rounded-lg text-emerald-400 font-bold">
                Mac: Cmd + Ctrl + Space
              </span>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveCategory('recents')}
              title="Recent"
              className={`p-1.5 rounded-xl transition ${
                activeCategory === 'recents'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            {EMOJI_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  title={cat.name}
                  className={`p-1.5 rounded-xl transition ${
                    activeCategory === cat.id
                      ? 'bg-white text-black shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Emoji Grid Area */}
      <div className="p-3 h-52 sm:h-64 overflow-y-auto space-y-3">
        {searchQuery ? (
          <div>
            <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-wider">
              Search Results ({filteredEmojis?.length || 0})
            </div>
            {filteredEmojis && filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                {filteredEmojis.map((item, idx) => (
                  <button
                    key={`${item.char}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item.char)}
                    className="w-9 h-9 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-xl hover:scale-125 transition active:scale-95"
                  >
                    {item.char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-xs">
                No matching emoji found. Try another word or use <span className="text-zinc-300 font-mono">Win + .</span>
              </div>
            )}
          </div>
        ) : activeCategory === 'recents' ? (
          <div>
            <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-wider">
              Frequently Used
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
              {recentEmojis.map((char, idx) => (
                <button
                  key={`${char}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(char)}
                  className="w-9 h-9 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-xl hover:scale-125 transition active:scale-95"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-mono text-zinc-500 mb-2 uppercase tracking-wider">
              {activeCategoryData?.name}
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
              {activeCategoryData?.emojis.map((item, idx) => (
                <button
                  key={`${item.char}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(item.char)}
                  className="w-9 h-9 rounded-xl hover:bg-zinc-800 flex items-center justify-center text-xl hover:scale-125 transition active:scale-95"
                >
                  {item.char}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Footer hint */}
      <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-950/90 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
        <span>Click any emoji to insert</span>
        <button
          type="button"
          onClick={() => setSystemHintVisible(true)}
          className="text-emerald-400/80 hover:text-emerald-300 transition underline"
        >
          OS shortcuts
        </button>
      </div>

    </div>
  );
}
