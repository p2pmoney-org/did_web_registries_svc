Installation
============
Installation is done in two steps.

First step: container setup
------------------------------------

To install your container run, as root, or as a user with docker privileges, from the directory (e.g. /home/myuser/did_web_registries_svc) where you want to install volume files the command line:

`$ docker run -i -t -e IMAGE_NAME=p2pmoney/did_web_registries_svc:latest -e HOME_ROOT_HOST_DIR=$(pwd) -v $(pwd):/homedir --entrypoint /home/root/setup/setup-container-starter.sh p2pmoney/did_web_registries_svc:latest`

Setup will guide you in defining the user under which the application will run inside the containers (e.g. 1000), the ports that will be exposed (e.g. 8000 for http access, 3336 for mysql,...).

Second step: application setup
-------------------------------------------
When container setup is finished. Start the container using the start-container.sh file that is created in your installation directory (e.g. /home/myuser/did_web_registries_svc)

`$ ./start-container.sh`

Then call from your browser the setup url:

`http://servername:port/admin`

(e.g. http://localhost:8000/admin, or http://192.168.0.1:8000/admin,...). You will then define the internal mysql root password, application user, REST url,...

Site management
===============

Administration of your container site will then be accessible through the admin url:

`http://servername:port/admin`

(e.g. http://localhost:8000/admin, or http://192.168.0.1:8000/admin,...).


You will authenticate with your mysql root password.

Exposing did:web registries
===========================

To expose your did:web registries, and make your registered dids resolvable from the internet, you need to expose one one side, the entry-point to allowing resolution of web path to did.json documents, and on the other side, optionally, expose an API entry-point to let external wallets register and manage did documents, accreditations, revokations.

Did documents resolution
------------------------
To expose the did:web registry, you will use a proxy solution to map calls from a dedicated domain name (e.g. https://mydidwebs.example.com) - or subfolder (e.g. https://example.com/mydidwebs) to the docker container.

If you are using nginx, forwarding will look like this:

### For a dedicated sub-domain

```
	server {
		listen              443 ssl;
		server_name         mydidwebs.example.com;
		keepalive_timeout   70;


		# did:web documents resolution
		location / {
			proxy_pass http://localhost:8000/api/registries/didweb/;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection 'upgrade';
			proxy_set_header Host $host;
			proxy_cache_bypass $http_upgrade;
		}
	}
```

### For a dedicated sub-folder

```
	server {
		listen              443 ssl;
		server_name         example.com;
		keepalive_timeout   70;


		# did:web documents resolution
		location /mydidwebs {
			proxy_pass http://localhost:8000/api/registries/didweb/;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection 'upgrade';
			proxy_set_header Host $host;
			proxy_cache_bypass $http_upgrade;
		}
	}
```

Exposing API entry-point
------------------------
To expose the API you will use a proxy solution to map calls from a dedicated domain name (e.g. https://mydidwebs.example.com/api) - or subfolder (e.g. https://example.com/mydidwebs/api) to the docker container api entry-point.

If you are using nginx, forwarding will look like this:

### For a dedicated sub-domain

```
	server {
		listen              443 ssl;
		server_name         mydidwebs.example.com;
		keepalive_timeout   70;


		# endpoint to serve registries api
		location /api {
			proxy_pass http://localhost:8000/api/registries;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection 'upgrade';
			proxy_set_header Host $host;
			proxy_cache_bypass $http_upgrade;
		}
	}
```

### For a dedicated sub-folder

```
	server {
		listen              443 ssl;
		server_name         example.com;
		keepalive_timeout   70;


		# endpoint to serve registries api
		location /mydidwebs/api {
			proxy_pass http://localhost:8000/api/registries;
			proxy_http_version 1.1;
			proxy_set_header Upgrade $http_upgrade;
			proxy_set_header Connection 'upgrade';
			proxy_set_header Host $host;
			proxy_cache_bypass $http_upgrade;
		}
	}
```

Disclaimers
===========

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
