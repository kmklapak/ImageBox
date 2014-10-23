(function () {
    var execute = function () {
        $(captricity.api).ready(function (){
            /*Try to open image for Preview */
            var readImage = function (input) {
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var html = '<img src="' + e.target.result + '">'
                        $('#img-preview').html(html);
                    }

                    reader.readAsDataURL(input.files[0]);
                }
            };
            /*Iterate through batches and add to select drop down*/
            var addBatchesToList = function (objects) {
                $("#loading").hide();
                $('#my-submit').hide();
                var results = [
                    {id: 0, text: "Create new Batch"}
                ];
                for (i = 0; i < objects.length; i++) {
                    results.push({id: objects.at(i).get('name'), text: objects.at(i).get('name')});
                }

                $('#image_batch').val("Create new Batch").select2({
                    placeholder: "Select a Batch",
                    data: results,
                    initSelection: function (element, callback) {
                        var data = {id: element.val(), text: element.val()};
                        callback(data);
                    }
                });
                $('#my-submit').show();
            }

            var addTemplatesToList = function () {
                $("#loading").hide();
                var results = [
                    {id: 0, text: "Create new Batch"}
                ];
                for (i = 0; i < templates.length; i++) {
                    results.push({id: templates.at(i).get('id'), text: templates.at(i).get('name')});
                }

                $('#templates').val("Select a Template").select2({
                    data: results,
                    initSelection: function (element, callback) {
                        var data = {id: element.val(), text: element.val()};
                        callback(data);
                    }
                });
            }

            /*Grab Data from API*/
            var batches = new captricity.api.Batches();
            batches.fetch({success: addBatchesToList});

            var templates = new captricity.api.Documents();
            templates.fetch();


            /*Execute image Preview */
            $("#image_file").change(function () {
                readImage(this);
            });

            var create_batch = function () {
                $(document).ready(function(){
                    var title = $(this).parent().children('.title').html();
                    /*Set Modal Title*/
                    $('.modal-title').html("Choose Batch Name");

                    /*Insert BatchName Input Fields*/
                    var fields = '<div class="control-group file required image_batch">' +
                        '<label class="required control-label"> Batch Name</label>' +
                        '<div class="controls"><input id="name"></div></div>' +
                        '<div class="control-group file required">' +
                        '<label class="required control-label">Template</label>' +
                        '<div class="controls"><input id="templates"></div></div>';

                    $('.modal-body').html(fields);
                    addTemplatesToList();

                    /*Insert Submit Button*/
                    var footer = '<input id="addBatchName" class="btn" name="commit" type="submit" value="Submit">';
                    $('.modal-footer').html(footer);

                    /*On submit function validate name and template and initiate batch create*/
                    $('#addBatchName').click(function () {
                        var batch_name = $("#name").val();
                        var template_id = $("#templates").val();
                        if (batch_name === "" ) {
                            alert("Please enter a batch name.")
                            return false;
                        };
                        if (template_id === "Select a Template") {
                            alert("Please select a template")
                            return false;
                        };
                        $('#image_batch').select2('data', {id: batch_name, text: batch_name});
                        $('#image_batch').select2("enable",false)
                        var name_used = false;
                        for (i = 0; i < batches.length; i++) {
                            if (batch_name === batches.at(i).get('name')) {
                                alert("Batch name already taken. Choose another name or exit popup and select batch from list.")
                                name_used = true;
                                break;
                            }
                        }
                        if (!name_used) {
                            var batch_id = 0;
                            var new_batch = batches.create({name: batch_name}, {
                                success: function () {
                                    alert("Batch created successfully");
                                    $("#myModal").modal('hide');
                                    return false;
                                }});
                        }
                        else{
                            alert("Please fill in batch name and select template.")
                            return false;
                        }
                    });
                    $("#myModal").modal();
                });
            };

            var load_batch_and_upload = function () {
                $("#uploader").show();
                batches.fetch();
                var batch_id = 0;
                for (i = 0; i < batches.length; i++) {
                    if (batches.at(i).get('name') === $("#image_batch").val()) {
                        batch_id = batches.at(i).get('id');
                        break;
                    }
                }
                var file = new captricity.api.BatchFiles();
                var file_already_exisits = false;
                file.batch_id = batch_id;
                file.fetch({success: function () {
                    for (i = 0; i < file.length; i++) {
                        if (file.at(i).get('file_name') === $("#image_file").prop('files')[0].name) {
                            file_already_exisits = true;
                            break;
                        }
                    }
                    if (!file_already_exisits) {
                        var uploader = new captricity.MultipartUploader({'uploaded_file': $("#image_file").prop('files')[0]}
                            , _.bind(function (f, percent) {
                                if (percent > 99) {
                                    file.fetch({success: function () {
                                        $("#new_image").submit();
                                    }});
                                }
                            }, this), file.url());
                    }
                    else {
                        alert("File already uploaded to this batch. Choose another file.")
                        $("#uploader").hide();
                    }
                }});
            };

            /*When form is submited check for new batch and load modal to choose name*/
            $('#my-submit').click(function () {
                var batchname = $("#image_batch").select2('data').text;
                if (batchname === "Create new Batch" || batchname === "" ) {
                    create_batch();
                    return false;
                } else {
                    load_batch_and_upload();
                    return false;
                }
            });
        });
    };

    function intialize(){
        $(captricity).ready(function(){
            captricity.connect_to_api();
            window.schema.fetch({success: execute})
            $(window).ajaxError(function (evt, jqXHR, settings, thrown) {
                alert('There was a problem with a request to url: ' + settings.url);
            });
        });
    };
    $('.image.new').ready(intialize);
    $(document).on('page:load',  intialize);
}());
