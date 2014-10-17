class ImagesController < ApplicationController
  before_action :user_signed_in?

  def index
     @images = Image.where(user_id: current_user).page(params[:page]).order('created_at DESC')
  end

  def new
    @image = Image.new
  end

  def create
    @image = Image.new(image_params)    # Not the final implementation!
    @image.user_id = current_user.id

    if @image.title == ""
      uploaded_file = params[:image][:file]
      @image.title = uploaded_file.original_filename
    end

    if @image.save
      flash[:success] = "Image successfully uploaded!"
      redirect_to images_path
    else
      render 'new'
    end
  end

  def edit
    @image = Image.find(params[:id])
  end

  def show
    @image=Image.find(params[:id])
    @title = @image.title
  end

  def update
    @image = Image.find(params[:id])
    if @image.update_attributes(image_params)
      flash[:notice] = "Successfully updated image."
      redirect_to root_path
    else
      render :action => 'edit'
    end
  end

  def destroy
    @image=Image.find(params[:id])
    @image.destroy
    flash[:notice] = "Successfully removed image."
    redirect_to root_path
  end

  def download
    @image = Image.find(params[:id])
    data = File.read(@image.file.path)
    send_data data, :filename => @image.original_name, :disposition => 'attachment',
              :type => "multipart/related"
  end


  private

  def image_params
    params.require(:image).permit(:title, :file)
  end

end
