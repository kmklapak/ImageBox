ImageBox::Application.routes.draw do
  resources :images
  devise_for :users, controllers: { registrations: 'registrations'}
  authenticated :user do
    root to: "images#index", as: :authenticated_root
  end
  unauthenticated do
    root to: "welcome#index"
  end
  match '/images',                              to: 'images#images.js',     via: 'get'
  match '/images/:id',          to: 'images#show',      via: 'get'
  match '/images/:id/edit',     to: 'images#edit',      via: 'get'
  match '/images/:id/download', to: 'images#download',  via: 'get', :as => 'image_download'
end
