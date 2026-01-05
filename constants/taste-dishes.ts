/**
 * Representative dishes for taste onboarding
 * Covers diverse cuisines, proteins, and spice levels
 */

export interface TasteDish {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  protein: string;
  spice_level: "low" | "medium" | "high";
  cooking_time: string;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl: string; // CDN URL
  mandatory: boolean; // First 6 are mandatory for onboarding
}

export const TASTE_DISHES: TasteDish[] = [
  {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    description: "Tender chicken in a creamy, spiced tomato sauce with aromatic Indian spices",
    cuisine: "Indian",
    protein: "chicken",
    spice_level: "high",
    cooking_time: "35 mins",
    difficulty: "Medium",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/ZecNEoRLZMYfIKgY.jpg",
    mandatory: true,
  },
  {
    id: "margherita-pizza",
    name: "Margherita Pizza",
    description: "Classic Italian pizza with fresh mozzarella, tomatoes, and basil",
    cuisine: "Italian",
    protein: "cheese",
    spice_level: "low",
    cooking_time: "20 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/JLHimooagJONOdvI.jpg",
    mandatory: true,
  },
  {
    id: "beef-tacos",
    name: "Beef Tacos",
    description: "Seasoned ground beef in crispy shells with fresh toppings",
    cuisine: "Mexican",
    protein: "beef",
    spice_level: "medium",
    cooking_time: "25 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/EbkRVfSdMVjaTHjd.jpg",
    mandatory: true,
  },
  {
    id: "salmon-teriyaki",
    name: "Salmon Teriyaki",
    description: "Glazed salmon with sweet and savory Japanese teriyaki sauce",
    cuisine: "Japanese",
    protein: "fish",
    spice_level: "low",
    cooking_time: "20 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/lAReNqNHPwPFqHPJ.jpg",
    mandatory: true,
  },
  {
    id: "vegetable-stir-fry",
    name: "Vegetable Stir Fry",
    description: "Colorful mix of fresh vegetables in a light Asian sauce",
    cuisine: "Chinese",
    protein: "tofu",
    spice_level: "medium",
    cooking_time: "15 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/hUrJULlaTyItgfKN.jpg",
    mandatory: true,
  },
  {
    id: "lamb-kebabs",
    name: "Lamb Kebabs",
    description: "Grilled lamb skewers with Middle Eastern spices and herbs",
    cuisine: "Middle Eastern",
    protein: "lamb",
    spice_level: "medium",
    cooking_time: "30 mins",
    difficulty: "Medium",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/uJsCOslQJVzXpDIg.jpg",
    mandatory: true,
  },
  {
    id: "pad-thai",
    name: "Pad Thai",
    description: "Stir-fried rice noodles with shrimp, peanuts, and tangy sauce",
    cuisine: "Thai",
    protein: "shrimp",
    spice_level: "high",
    cooking_time: "25 mins",
    difficulty: "Medium",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/RolKunfOvzGzBSqH.jpg",
    mandatory: false,
  },
  {
    id: "mushroom-risotto",
    name: "Mushroom Risotto",
    description: "Creamy Italian rice with earthy mushrooms and Parmesan",
    cuisine: "Italian",
    protein: "mushrooms",
    spice_level: "low",
    cooking_time: "40 mins",
    difficulty: "Hard",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/zzsblAHXunZaTHaM.jpg",
    mandatory: false,
  },
  {
    id: "chicken-fajitas",
    name: "Chicken Fajitas",
    description: "Sizzling chicken and peppers with warm tortillas",
    cuisine: "Mexican",
    protein: "chicken",
    spice_level: "medium",
    cooking_time: "20 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/CIdHYpZAjVHWtGlG.jpg",
    mandatory: false,
  },
  {
    id: "lentil-curry",
    name: "Lentil Curry",
    description: "Hearty vegetarian curry with protein-rich lentils and aromatic spices",
    cuisine: "Indian",
    protein: "lentils",
    spice_level: "high",
    cooking_time: "35 mins",
    difficulty: "Easy",
    imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031854737/VJyUehWasBEfMVCK.jpg",
    mandatory: false,
  },
];
