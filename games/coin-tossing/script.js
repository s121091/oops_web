// Global variables to store the tossing history and statistics
var array_tossHistory = [];     // Array to store the sequence of "H" and "T" results
var headCounter;                // Tracks the total number of Heads
var tailCounter;                // Tracks the total number of Tails
var totalCounter;               // Tracks the total number of valid tosses performed

// Main function triggered when the "Start Tossing" button is clicked
function startTossing() {

    // Declares local variables 'input_tosses' and 'input_probability'.
    // Assigns the parsed values retrieved from the HTML input fields.
    var input_tosses = parseInt(document.getElementById("input_tosses").value);
    var input_probability = parseFloat(document.getElementById("input_probability").value);

    // Checks if the input tosses are strictly greater than 0, and the probability is between 0 and 1 inclusive.
    // If true, proceeds with the simulation.
    // If false, calls the print_errorMessage() function.
    if (input_tosses > 0 && input_probability >= 0 && input_probability <= 1){

        // Resets the tracking array and all counters to zero for the new batch of tosses.
        array_tossHistory = [];
        headCounter = 0;
        tailCounter = 0;
        totalCounter = 0;
        
        // Loops for the number of iterations specified by the 'input_tosses' parameter.
        for (var i = 0; i < input_tosses; i++){
            
            // Declares a local variable 'result' to store the returned string from the flip() function.
            var result = flip(input_probability);
            
            // Checks if the returned result is exactly "H".
            // If true, appends "H" to the array and increments the 'headCounter'.
            // If false, appends "T" to the array and increments the 'tailCounter'.
            if (result === "H") {
                array_tossHistory.push("H");
                headCounter++;
            } else {
                array_tossHistory.push("T");
                tailCounter++;
            }
            totalCounter++;     // Increments the 'totalCounter' variable by 1.
        }

        // Calls the respective functions to calculate and return the final results to the HTML document.
        print_tossesResult();
        print_headsCounter();
        print_tailsCounter();
        print_headsPercentage();
        print_tailsPercentage();

    } else {
        print_errorMessage();   // Display an error message
    }
}

/**
 * Determines the result of a single toss using a random decimal.
 * @param prob The target probability for getting heads.
 * @return The string "H" if heads, or "T" if tails.
 */
function flip(prob) {
    // Evaluates if the generated random decimal is less than the probability parameter.
    // Returns "H" if true, otherwise returns "T".
    return Math.random() < prob ? "H" : "T";
}

// Formats the history of all tosses into a single string and displays it.
function print_tossesResult(){

    // Declares a local variable 'Temp_printArrary' to store the concatenated string.
    var Temp_printArrary = "";

    // Loops through the 'array_tossHistory' array to concatenate each result with a space.
    for ( var i = 0; i < array_tossHistory.length; i++ ) {
        Temp_printArrary += array_tossHistory[i] + " "; // Appends each result with a space
    }
    
    // Assigns the concatenated string to the value field of the HTML textarea.
    document.getElementById("print_tossesResult").value = Temp_printArrary;
}

// Gets the current value of the headCounter field and updates the HTML element.
function print_headsCounter() {
    document.getElementById("print_headsCounter").innerHTML = headCounter;
}

// Gets the current value of the tailCounter field and updates the HTML element.
function print_tailsCounter() {
    document.getElementById("print_tailsCounter").innerHTML = tailCounter;
}

// Calculates the percentage of Heads and updates the HTML element.
function print_headsPercentage() {
    var headsPercentage;
    headsPercentage = headCounter / totalCounter;

    // Calculates and returns the rounded percentage to the HTML innerHTML field.
    document.getElementById("print_headsPercentage").innerHTML = (Math.round(headsPercentage * 1000) / 10) + "%";
}

// Calculates and displays the percentage of Tails (rounded to 1 decimal place)
function print_tailsPercentage() {
    var tailsPercentage;
    tailsPercentage = tailCounter / totalCounter;

    // Calculates and returns the rounded percentage to the HTML innerHTML field.
    document.getElementById("print_tailsPercentage").innerHTML = (Math.round(tailsPercentage * 1000) / 10) + "%";
}

// Displays an error message in the history textarea when invalid input is detected.
function print_errorMessage() {
    document.getElementById("print_tossesResult").value = "Oops! \nPlease make sure 'Tosses' is a positive integer and 'Probability' is between 0.0 and 1.0.";
}

// Resets all input fields, output statistics, and the history textarea to their default empty states.
function resetAll() {
    document.getElementById("input_tosses").value = "";
    document.getElementById("input_probability").value = "";
    document.getElementById("print_tossesResult").value = "Please enter the number of tosses and the probability first!";
    document.getElementById("print_headsCounter").innerHTML = "0";
    document.getElementById("print_tailsCounter").innerHTML = "0";
    document.getElementById("print_headsPercentage").innerHTML = "0.0%";
    document.getElementById("print_tailsPercentage").innerHTML = "0.0%";
}