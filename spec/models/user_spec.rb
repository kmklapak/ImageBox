require 'spec_helper'

describe User do

  before(:each) do
    @attr = {
        :username => "Username",
        :email => "user@example.com",
        :password => "password",
        :password_confirmation => "password"
    }
  end

  it "should create a new instance given a valid attribute" do
    User.create!(@attr)
  end

  it "should require a username" do
    no_username = User.new(@attr.merge(:username => ""))
    no_username.should_not be_valid
  end

end