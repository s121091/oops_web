// Global variables to track the slideshow state
var counter = 0;                // Tracks the number of animals shown in the current round
var array_selecter = [];        // Stores the indices of animals already shown to prevent repetition
var randomNumber = 0;           // Temporarily stores the generated random decimal
var selecter = 0;               // Stores the rounded random integer (0-5)
var currentAnimalUrl = "";      // Stores the Wikipedia URL of the currently displayed animal

// Main function triggered when the "Show Random Animal" button is clicked
// Selects and displays a random animal without repetition in a round of 6.
function Show() {

    // Checks if the completed animals shown are less than 6.
    // If true, proceeds to select and show a new animal.
    // If false, resets the tracking arrays and counters.
    if (counter < 6) {

        randomNumber = Math.random() * 6;       // Generate a random integer between 0 and 5
        selecter = Math.floor(randomNumber);    // Rounds down the 'randomNumber' to the nearest integer

        // Declares a local variable 'isDuplicate' to track if the selected animal has already been shown.
        var isDuplicate = false;

        // Loops through the 'array_selecter' array to check for duplicate animal indices.
        for (var i = 0; i < array_selecter.length; i++) {

            // Checks if the current array element matches the selected integer.
            // If true, marks 'isDuplicate' as true and breaks the loop.
            if (array_selecter[i] == selecter) {
                isDuplicate = true;
                break;
            }
        }

        // Checks if the selected animal is not a duplicate.
        // If true, displays the animal and updates the state.
        // If false, recursively calls the Show() function to draw a new integer.
        if (isDuplicate == false) {
            
            // Evaluates the 'selecter' value and calls the corresponding function to display the image and name.
            switch (selecter) {
                case 0:
                    print_image0();
                    break;
                case 1:
                    print_image1();
                    break;
                case 2:
                    print_image2();
                    break;
                case 3:
                    print_image3();
                    break;
                case 4:
                    print_image4();
                    break;
                case 5:
                    print_image5();
                    break;
            }

            counter++;                          // Increments the 'counter' variable by 1.
            array_selecter.push(selecter);      // Appends the 'selecter' parameter to the 'array_selecter' array.

        } else { 
            Show();     // If the animal was already shown, call Show() again to draw a new one
        }

    } else {
        // Clears the 'array_selecter' array and resets the 'counter' to 0.
        array_selecter = [];
        counter = 0;
        
        // Calls the Show() function to immediately show the first animal of the new round.
        Show();
    }

    // Calls the print_counter() function to update the displayed number of animals shown.
    print_counter();
}


// Functions to display specific animal images, names, and Wikipedia URL
// Updates the HTML elements to display the Giant Panda image and name.
// Assigns the corresponding Wikipedia URL to the 'currentAnimalUrl' instance variable.
function print_image0() {
    document.getElementById("Output").innerHTML = "<img src='GiantPanda.png'>";
    document.getElementById("imageName").innerHTML = "Giant Panda";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Giant_panda";
}

function print_image1() {
    document.getElementById("Output").innerHTML = "<img src='Procyonlotor.png'>";
    document.getElementById("imageName").innerHTML = "Procyon Lotor";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Raccoon";
}

function print_image2() {
    document.getElementById("Output").innerHTML = "<img src='Arcticfox.png'>";
    document.getElementById("imageName").innerHTML = "Arctic Fox";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Arctic_fox";
}

function print_image3() {
    document.getElementById("Output").innerHTML = "<img src='Quokka.png'>";
    document.getElementById("imageName").innerHTML = "Quokka";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Quokka";
}

function print_image4() {
    document.getElementById("Output").innerHTML = "<img src='SeaOtter.png'>";
    document.getElementById("imageName").innerHTML = "Sea Otter";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Sea_otter";
}

function print_image5() {
    document.getElementById("Output").innerHTML = "<img src='AdeliePenguin.png'>";
    document.getElementById("imageName").innerHTML = "Adelie Penguin";
    currentAnimalUrl = "https://en.wikipedia.org/wiki/Ad%C3%A9lie_penguin";
}

// Resets the slideshow to its initial empty state
function Restart(){
    // Assigns default strings and values to the HTML elements.
    document.getElementById("Output").innerHTML = "No animal shown yet";
    document.getElementById("imageName").innerHTML = "";
    document.getElementById("imageCounter").innerHTML = 0;
    
    // Clears the tracking array, counter, and URL.
    array_selecter = [];
    counter = 0;
    currentAnimalUrl = "";
}

// Gets the current value of the counter field and updates the HTML element.
function print_counter() {
    document.getElementById("imageCounter").innerHTML = counter;
}

// Checks if a valid animal URL exists and opens it in a new tab.
function AnimalsInfo() {

    // Checks if the 'currentAnimalUrl' field is not an empty string.
    if (currentAnimalUrl !== "") {
        openLink(currentAnimalUrl);     // If true, calls the openLink() method.
    } else {
        // If false, displays a prompt message requiring the user to show an animal first.
        document.getElementById("imageName").innerHTML = "Please show an animal first!";
    }
}

/**
 * Creates a HyperLink to open the URL in a new tab
 * @param url The target URL to be opened.
 */
function openLink(url) {
    var newHyperLink = document.createElement("a");
    newHyperLink.href = url;
    newHyperLink.target = "_blank";
    newHyperLink.style.display = "none";
    document.body.appendChild(newHyperLink);
    newHyperLink.click();
    document.body.removeChild(newHyperLink);
}