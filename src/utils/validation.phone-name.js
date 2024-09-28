// valid firstname func
const isValidfullName = (firstName) => {
    return /^[A-Z][a-z]{2,}(?: [A-Z][a-z]{2,})+$/.test(firstName);
};

// valid phone func
const isValidPhoneNumber = (phoneNumber) => {
    const regex = /^\+998([-])?([ ])?(90|91|93|94|95|98|99|33|97|71|77)([-])?([ ])?(\d{3})([-])?([ ])?(\d{2})([-])?([ ])?(\d{2})$/;
    return regex.test(phoneNumber);
};

module.exports = { isValidfullName, isValidPhoneNumber }