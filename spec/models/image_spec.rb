require 'spec_helper'

describe Image do

  before(:each) do
    @user = FactoryGirl.create(:user)
    @attr = {
        file: Rack::Test::UploadedFile.new(File.open(File.join(Rails.root, '/spec/fixtures/images/image.jpg'))),
        title: "Image Title"
    }
  end

  it "should have a valid image" do
    @user.images.create!(@attr)
  end

  describe "user associations" do
    before(:each) do
      @image = @user.images.create(@attr)
    end

    it "should have a user attribute" do
      @image.should respond_to(:user)
    end

    it "should have the right associated user" do
      @image.user_id.should == @user.id
      @image.user.should == @user

    end
  end

  describe "validations" do

    it "should require a user id" do
      Image.new(@attr).should_not be_valid
    end

    it "should allow optional title" do
      @attr[:title] = ""
      @user.images.build(@attr).should be_valid
    end

    it "should reject long titles" do
      @attr[:title] = "a"*140
      @user.images.build(@attr).should_not be_valid
    end

    it "should save image with a uniqye random name" do
      @image = @user.images.build(@attr)
      @image.file.should_not eq "image.jpg"
    end

    it "should store original filename" do
      @image = @user.images.build(@attr)
      @image.original_name.should eq "image.jpg"
    end

  end

end
