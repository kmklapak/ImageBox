FactoryGirl.define do

  sequence :email do |n|
    "person#{n}@example.com"
  end

  sequence :username do |n|
    "person#{n}"
  end

  factory :image do
    title "Image Title"
    user
    file Rack::Test::UploadedFile.new(File.open(File.join(Rails.root, '/spec/fixtures/images/image.jpg')))
  end

  factory :user do
    username { generate(:username)}
    email { generate(:email)}
    password "password"
    password_confirmation "password"
  end
end