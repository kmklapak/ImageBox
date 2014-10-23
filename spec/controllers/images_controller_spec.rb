require 'spec_helper'

describe ImagesController do
  render_views

  describe "access control" do
    it "should deny access to 'create'" do
      post :create
      response.should redirect_to(new_user_session_path)
    end

    it "should deny access to 'destroy'" do
      delete :destroy, :id => 1
      response.should redirect_to(new_user_session_path)
    end
  end

  describe "POST 'create'" do

    before(:each) do
      @user = sign_in(FactoryGirl.create(:user))
    end

    describe "failure" do

      before(:each) do
        @attr = { :file => "" }
      end

      it "should not create image" do
        lambda do
          post :create, :image => @attr
        end.should_not change(Image, :count)
      end

      it "should re-render the image new page" do
        post :create, :image => @attr
        response.should render_template("images/new")
      end
    end

    describe "success" do

      before(:each) do
        @attr = { :file => Rack::Test::UploadedFile.new(File.open(File.join(Rails.root, '/spec/fixtures/images/image.jpg')))
        }
      end

      it "should create a image" do
        lambda do
          post :create, :image => @attr
        end.should change(Image, :count).by(1)
      end

      it "should redirect to the root path" do
        post :create, :image => @attr
        response.should redirect_to(root_path)
      end

      it "should have a flash success message" do
        post :create, :image => @attr
        flash[:success].should include("Image successfully uploaded!")
      end
    end
  end

  describe "DELETE 'destroy'" do

    describe "for an unauthorized user" do

      before(:each) do
        @user = FactoryGirl.create(:user)
        wrong_user = FactoryGirl.create(:user)
        @image = FactoryGirl.create(:image, :user => @user)
        sign_in(wrong_user)
      end

      it "should deny access" do
        delete :destroy, :id => @image
        response.should redirect_to(root_path)
      end
    end

    describe "for an authorized user" do

      before(:each) do
        @image = FactoryGirl.create(:image)
        sign_in(@image.user)
      end

      it "should destroy the image" do
        lambda do
          delete :destroy, :id => @image
          response.should redirect_to(root_path)
        end.should change(Image, :count).by(-1)
      end
    end
  end
end