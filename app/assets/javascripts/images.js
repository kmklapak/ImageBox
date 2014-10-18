init = function() {
    // When file input changes, try to render preview image
    $("#image_file").change(function() {
        readImage(this);
    });

    $('.image img').click(function(){
        $('.modal-body').empty();
        var title = $(this).parent().children('.title').html();
        $('.modal-title').html(title);
        var img = $('<img class="full-size-image">');
        var full = $(this).parent().children('#full_size').val();
        img.attr('src',full);
        img.appendTo('.modal-body');
        $('#myModal').modal({show:true});
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
    init();
});
$(window).bind('page:change', function() {
    init();
})