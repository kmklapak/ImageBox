ImageBox::Application.routes.draw do
  devise_for :users
  root to: "images#index"
  match '/images',              to: 'images#index',     via: 'get'
  match '/images/:id',          to: 'images#show',      via: 'get'
  match '/images/:id/edit',     to: 'images#edit',      via: 'get'
  match '/images/new',          to: 'images#new',       via: 'get'
end
