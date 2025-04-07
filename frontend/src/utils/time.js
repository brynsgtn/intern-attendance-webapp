export const formatTime = (dateString) => {
    // If the dateString is empty or undefined, return "Not recorded"
    if (!dateString || dateString.trim() === '') {
        return "Not recorded";
    }

    const date = new Date(dateString);

    // If the date is invalid, return "Invalid Date"
    if (isNaN(date.getTime())) {
        return "no record";
    }

    // If the date is valid, return the formatted time
    return date.toLocaleString("en-US", {
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true,
    });
};
