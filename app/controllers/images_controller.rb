class ImagesController < ApplicationController
  before_action :user_signed_in?

  def index
     @images = Image.where(user_id: current_user).paginate(:page => params[:page]).order('id DESC')
  end

  def new
    @image = Image.new
  end

  def create
    @image = Image.new(image_params)
    @image.user_id = current_user.id
    if @image.save
      flash[:success] = "Image successfully uploaded!"
      redirect_to images_path
    else
      redirect_to new_image_path
    end
  end

  def edit
    @image = Image.friendly.find(params[:id])
  end

  def show
    @image=Image.friendly.find(params[:id])
  end

  def update
    @image = Image.friendly.find(params[:id])
    if @image.update_attributes(image_params)
      flash[:notice] = "Successfully updated image."
      redirect_to root_path
    else
      render :action => 'edit'
    end
  end

  def destroy
    @image=Image.friendly.find(params[:id])
    @image.destroy
    flash[:notice] = "Successfully removed image."
    redirect_to root_path
  end

  private
  def image_params
    params.require(:image).permit(:title, :file, :batch)
  end

end
