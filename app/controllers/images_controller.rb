class ImagesController < ApplicationController
  before_action :authenticate_user!
  before_action :correct_user, only: [:edit, :update, :show]

  def index
     @images = Image.where(user_id: current_user).paginate(:page => params[:page]).order('id DESC')
  end

  def new
    @image = Image.new
  end

  def create
    @image = current_user.images.build(image_params)
    if @image.save
      flash[:success] = "Image successfully uploaded!"
      redirect_to authenticated_root_path
    else
      render 'images/new'
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
      redirect_to authenticated_root_path
    else
      render :action => 'edit'
    end
  end

  def destroy
    @image=Image.friendly.find(params[:id])
    name = @image.original_name
    @image.destroy
    flash[:notice] = "Successfully removed image " + name
    redirect_to authenticated_root_path
  end

  private
  def image_params
    params.require(:image).permit(:title, :file, :batch)
  end

  def correct_user
    @image=Image.friendly.find(params[:id])
    @user = User.find(@image.user_id)
    if current_user != @user
      flash[:notice] = "Don't have access to Image " + @image.id.to_s
      redirect_to(root_url)
    end
  end

end
