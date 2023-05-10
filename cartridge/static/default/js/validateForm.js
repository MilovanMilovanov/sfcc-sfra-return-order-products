
$(document).ready(function () {

    var form = $('#products-return-form')[0];

    $('body').on('click', '.return-products-btn', function (e) {
        e.preventDefault();
        // TO DO: create algorithm for selecting a specific items options, instead for every item.

        var selects = Array.from(document.querySelectorAll('select'));

        var areAllOptionSelected = selects.some(select => {
            if (select.value === 'default') {
                alert('Please selects an option for all products');
                return select
            }
        })

        if (!areAllOptionSelected) {
            form.submit();
        }

    });
});