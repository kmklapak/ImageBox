ImageBox::Application.routes.draw do
  resources :images
  devise_for :users, controllers: { registrations: 'registrations'}
  root to: "images#index"
  match '/images',              to: 'images#index',     via: 'get'
  match '/images/:id',          to: 'images#show',      via: 'get'
  match '/images/:id/edit',     to: 'images#edit',      via: 'get'
  match '/images/:id/download', to: 'images#download',  via: 'get', :as => 'image_download'
end
