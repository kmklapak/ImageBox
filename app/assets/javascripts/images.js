preview_image = function() {
    // When file input changes, try to render preview image
    $("#image_file").change(function() {
        readImage(this);
    });

    // Try to read selected image and render to page
    var readImage = function(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function(e) {
                var html = '<img src="' + e.target.result + '">'
                $('#img-preview').html(html);
            }

            reader.readAsDataURL(input.files[0]);
        }
    };
}



$(function() {
    preview_image();
});
$(window).bind('page:change', function() {
    preview_image();
})