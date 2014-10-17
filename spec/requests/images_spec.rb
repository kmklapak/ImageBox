require 'spec_helper'

describe "Image Pages" do
  subject { page }


  describe "signup page" do
    before { visit new_user_registration }

    it { should have_content('Sign up') }
  end
end
