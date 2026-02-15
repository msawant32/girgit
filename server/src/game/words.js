export const WORD_DATABASE = {
  "Animals": [
    "Lion", "Elephant", "Penguin", "Dolphin", "Tiger",
    "Giraffe", "Kangaroo", "Eagle", "Shark", "Panda",
    "Koala", "Zebra", "Cheetah", "Gorilla", "Octopus",
    "Butterfly", "Horse", "Wolf", "Bear", "Fox"
  ],
  "Food": [
    "Pizza", "Sushi", "Burger", "Pasta", "Tacos",
    "Salad", "Steak", "Sandwich", "Curry", "Ramen",
    "Croissant", "Pancakes", "Waffles", "Ice Cream", "Chocolate",
    "Soup", "Burrito", "Lasagna", "Risotto", "Dumplings"
  ],
  "Movies": [
    "Titanic", "Avatar", "Inception", "Gladiator", "Frozen",
    "Jaws", "Shrek", "Matrix", "Joker", "Rocky",
    "Casablanca", "Aladdin", "Brave", "Up", "Cars",
    "Moana", "Coco", "Thor", "Wonder", "Gravity"
  ],
  "Countries": [
    "Japan", "Brazil", "Egypt", "Australia", "Canada",
    "France", "India", "Mexico", "Italy", "Spain",
    "Greece", "Norway", "Thailand", "Argentina", "Kenya",
    "Iceland", "Peru", "Turkey", "Vietnam", "Morocco"
  ],
  "Sports": [
    "Soccer", "Basketball", "Tennis", "Swimming", "Baseball",
    "Cricket", "Golf", "Boxing", "Skiing", "Surfing",
    "Volleyball", "Hockey", "Rugby", "Badminton", "Cycling",
    "Wrestling", "Karate", "Gymnastics", "Archery", "Fencing"
  ],
  "Professions": [
    "Doctor", "Teacher", "Chef", "Pilot", "Engineer",
    "Artist", "Lawyer", "Nurse", "Firefighter", "Scientist",
    "Musician", "Writer", "Architect", "Detective", "Farmer",
    "Dentist", "Photographer", "Mechanic", "Astronaut", "Designer"
  ],
  "Colors": [
    "Red", "Blue", "Green", "Yellow", "Purple",
    "Orange", "Pink", "Black", "White", "Brown",
    "Gray", "Gold", "Silver", "Turquoise", "Maroon",
    "Lavender", "Crimson", "Teal", "Indigo", "Coral"
  ],
  "Vehicles": [
    "Car", "Bicycle", "Train", "Airplane", "Boat",
    "Motorcycle", "Helicopter", "Submarine", "Rocket", "Scooter",
    "Truck", "Bus", "Yacht", "Tractor", "Ambulance",
    "Taxi", "Limousine", "Skateboard", "Spaceship", "Canoe"
  ],
  "Music Genres": [
    "Rock", "Jazz", "Pop", "Hip Hop", "Classical",
    "Blues", "Country", "Electronic", "Reggae", "Metal",
    "Folk", "Soul", "Punk", "Disco", "Opera",
    "Techno", "Gospel", "Salsa", "Indie", "Funk"
  ],
  "Furniture": [
    "Chair", "Table", "Sofa", "Bed", "Desk",
    "Cabinet", "Bookshelf", "Lamp", "Mirror", "Wardrobe",
    "Bench", "Dresser", "Nightstand", "Ottoman", "Stool",
    "Chandelier", "Armchair", "Hammock", "Cradle", "Recliner"
  ],
  "Technology": [
    "Smartphone", "Laptop", "Tablet", "Camera", "Television",
    "Headphones", "Keyboard", "Mouse", "Printer", "Router",
    "Smartwatch", "Drone", "Speaker", "Microphone", "Projector",
    "Scanner", "Monitor", "Controller", "Charger", "USB"
  ],
  "Nature": [
    "Mountain", "Ocean", "Forest", "Desert", "River",
    "Volcano", "Waterfall", "Beach", "Lake", "Island",
    "Canyon", "Valley", "Cave", "Jungle", "Glacier",
    "Meadow", "Cliff", "Swamp", "Reef", "Prairie"
  ],
  "Weather": [
    "Sunny", "Rainy", "Snowy", "Cloudy", "Windy",
    "Stormy", "Foggy", "Thunder", "Lightning", "Hail",
    "Drizzle", "Hurricane", "Tornado", "Blizzard", "Rainbow",
    "Frost", "Mist", "Humid", "Drought", "Monsoon"
  ],
  "Emotions": [
    "Happy", "Sad", "Angry", "Excited", "Scared",
    "Surprised", "Confused", "Proud", "Jealous", "Nervous",
    "Calm", "Bored", "Anxious", "Confident", "Lonely",
    "Grateful", "Frustrated", "Hopeful", "Embarrassed", "Curious"
  ],
  "Clothing": [
    "Shirt", "Pants", "Dress", "Jacket", "Shoes",
    "Hat", "Socks", "Sweater", "Scarf", "Gloves",
    "Coat", "Jeans", "Skirt", "Tie", "Belt",
    "Hoodie", "Shorts", "Sandals", "Boots", "Cap"
  ],
  "Hobbies": [
    "Reading", "Painting", "Cooking", "Gaming", "Gardening",
    "Photography", "Dancing", "Singing", "Writing", "Fishing",
    "Hiking", "Knitting", "Collecting", "Camping", "Drawing",
    "Yoga", "Running", "Baking", "Crafting", "Cycling"
  ],
  "School Subjects": [
    "Math", "Science", "History", "English", "Art",
    "Music", "Geography", "Chemistry", "Physics", "Biology",
    "Literature", "Economics", "Psychology", "Philosophy", "Drama",
    "Spanish", "French", "Algebra", "Geometry", "Calculus"
  ],
  "Fruits": [
    "Apple", "Banana", "Orange", "Mango", "Strawberry",
    "Grape", "Watermelon", "Pineapple", "Peach", "Cherry",
    "Kiwi", "Lemon", "Blueberry", "Raspberry", "Coconut",
    "Papaya", "Pomegranate", "Plum", "Pear", "Apricot"
  ],
  "Instruments": [
    "Guitar", "Piano", "Drums", "Violin", "Flute",
    "Trumpet", "Saxophone", "Cello", "Clarinet", "Harp",
    "Accordion", "Banjo", "Trombone", "Ukulele", "Harmonica",
    "Xylophone", "Tambourine", "Bagpipes", "Oboe", "Tuba"
  ],
  "Buildings": [
    "House", "School", "Hospital", "Museum", "Library",
    "Church", "Theater", "Stadium", "Castle", "Temple",
    "Skyscraper", "Factory", "Warehouse", "Lighthouse", "Barn",
    "Observatory", "Prison", "Mansion", "Tower", "Monument"
  ]
};

export function getRandomCategory() {
  const categories = Object.keys(WORD_DATABASE);
  return categories[Math.floor(Math.random() * categories.length)];
}

export function getRandomWord(category) {
  const words = WORD_DATABASE[category];
  if (!words) return null;
  return words[Math.floor(Math.random() * words.length)];
}

export function getCategoryAndWord() {
  const category = getRandomCategory();
  const word = getRandomWord(category);
  return { category, word };
}
