(function() {

    var images = function() {
        $(".images.index").ready(function () {
            $('.image img').click(function () {
                var title = $(this).parent().children('.title').html();
                $('.modal-title').html(title);
                var img = $('<img class="full-size-image">');
                var full = $(this).parent().children('#full_size').val();
                img.attr('src', full);
                $('.modal-body').html(img);
                $('#myModal').modal({show: true});
            });
        });
    }

    $(document).ready(images);
    $(document).on('page:load', images);

}());

