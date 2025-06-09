import random
import string

def generate_password(length=12, include_lowercase=True, include_uppercase=True, include_numbers=True, include_symbols=True):
    """Generates a random password of specified length and character types."""

    characters = ""
    if include_lowercase:
        characters += string.ascii_lowercase
    if include_uppercase:
        characters += string.ascii_uppercase
    if include_numbers:
        characters += string.digits
    if include_symbols:
        characters += string.punctuation

    if not characters:  # Handle case where no character types are selected
        return "Please select at least one character type."

    password = ''.join(random.choice(characters) for i in range(length))
    return password

# Contoh penggunaan:
password_length = int(input("Mau password sepanjang berapa karakter? "))

# Kita bikin pilihannya lebih interaktif, yeay!
while True:
    lowercase = input("Mau pake huruf kecil? (y/n): ").lower()
    if lowercase in ('y', 'n'):
        break
    print("Input salah, coba lagi!")

while True:
    uppercase = input("Mau pake huruf besar? (y/n): ").lower()
    if uppercase in ('y', 'n'):
        break
    print("Input salah, coba lagi!")

while True:
    numbers = input("Mau pake angka? (y/n): ").lower()
    if numbers in ('y', 'n'):
        break
    print("Input salah, coba lagi!")

while True:
    symbols = input("Mau pake simbol? (y/n): ").lower()
    if symbols in ('y', 'n'):
        break
    print("Input salah, coba lagi!")


generated_password = generate_password(length=password_length, 
                                        include_lowercase=(lowercase == 'y'), 
                                        include_uppercase=(uppercase == 'y'), 
                                        include_numbers=(numbers == 'y'), 
                                        include_symbols=(symbols == 'y'))

print("\nPassword kamu:", generated_password)