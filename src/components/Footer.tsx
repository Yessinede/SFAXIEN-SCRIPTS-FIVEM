
export const Footer = () => {
  return (
    <footer className="bg-black border-t border-blue-900/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/lovable-uploads/d2ad3974-e460-4312-a099-fac4fa8fcff3.png" 
                  alt="SFAXIEN SCRIPTS Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">SFAXIEN SCRIPTS</h3>
                <p className="text-xs text-blue-400">Premium FiveM Resources</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Your trusted source for high-quality FiveM resources. From QBCore scripts to custom MLOs, 
              we provide everything you need to enhance your server.
            </p>
            <div className="flex space-x-4">
              <a href="https://discord.gg/2zHTnuH6" 
                 className="text-blue-400 hover:text-blue-300 transition-colors">
                Discord
              </a>
              <a href="https://sfaxien-scripts.gitbook.io/sfaxien-scripts/" className="text-blue-400 hover:text-blue-300 transition-colors">
                Support
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Scripts</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">MLOs</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Vehicles</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Clothing</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="https://sfaxien-scripts.gitbook.io/sfaxien-scripts/" className="text-gray-400 hover:text-blue-400 transition-colors">Documentation</a></li>
              <li><a href="https://sfaxien-scripts.gitbook.io/sfaxien-scripts/" className="text-gray-400 hover:text-blue-400 transition-colors">Installation Guide</a></li>
              <li><a href="https://discord.gg/2zHTnuH6" className="text-gray-400 hover:text-blue-400 transition-colors">Contact</a></li>
              <li><a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 SFAXIEN SCRIPTS. All rights reserved. Made with ❤️ for the FiveM community.
          </p>
        </div>
      </div>
    </footer>
  );
};
