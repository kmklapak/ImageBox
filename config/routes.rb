ImageBox::Application.routes.draw do

  get "images/index"
  get "images/new"
  get "images/edit"
  get "images/show"
  get "pages/home"
  get "pages/help"
  devise_for :users
  root to: "home#index"


end
