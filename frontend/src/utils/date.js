export const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    return date.toLocaleString("en-US", {
        month: "2-digit", // This gives the 2-digit month format
        day: "2-digit", // This gives the 2-digit day format
        year: "2-digit", // This gives the 2-digit year format
        timeZone: 'Asia/Manila' // Set timezone to Manila consistently
    });
};
