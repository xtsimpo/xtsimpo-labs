const container = document.getElementById("blog-container");
const postContainer = document.getElementById("post-container");

fetch("assets/data/posts.json")
  .then(res => res.json())
  .then(posts => {

    if(container){
      posts.forEach(post => {
        container.innerHTML += `
          <div class="glass reveal">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <a href="post.html?id=${post.id}">Read More →</a>
          </div>
        `;
      });
    }

    if(postContainer){
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      const post = posts.find(p => p.id === id);

      if(post){
        postContainer.innerHTML = `
          <h1>${post.title}</h1>
          <p>${post.date}</p>
          <div>${post.content}</div>
        `;
      }
    }

  });
