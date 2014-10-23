require 'spec_helper'

describe "Welcome" do

  subject { page }

  describe "index" do

    before(:each) do
      visit root_path
    end
    it { should have_title('Welcome') }
    it { should have_link('Sign In') }
    it { should_not have_link('Sign out') }
    it { should have_link('Sign up now!') }

    describe "user links" do

      describe "sign up button" do
        it "should redirect to sign up page" do
            click_link "Sign up now!"
            current_path.should == new_user_registration_path
        end
      end

      describe "sign in button" do
        it "should redirect to sign in page" do
            first(:link, "Sign In").click
            current_path.should == new_user_session_path
        end
      end

    end

  end

end
