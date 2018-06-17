#include "Mesh.h"
#include "State.h"

#include "Material.h"
#include "Texture.h"

#include <sstream>


inline std::string extractPath(std::string filename) {
	while (filename.find('\\') != std::string::npos)
		filename.replace(filename.find('\\'), 1, 1, '/');
	size_t pos = filename.rfind('/');
	if (pos == std::string::npos) return "";
	filename = filename.substr(0, pos);
	if (filename.size() > 0) filename += '/';
	return filename;
}


/*std::vector<std::string> splitString(const std::string& str, char delim) {
	std::vector<std::string> elems;
	std::stringstream sstream(str);
	std::string item;
	if (str != "") {
		while (std::getline(sstream, item, delim)) {
			elems.push_back(item);
		}
	}
	return elems;
}*/

template <typename T>
vector<T> splitStr(const std::string& str, char delim) {
	vector<T> elems;
	stringstream sstream(str);
	string item;
	if (str != "") {
		while (std::getline(sstream, item, delim)) {
			istringstream istream(item);
			T elem;
			istream >> elem;
			elems.push_back(elem);
		}
	}
	return elems;
}


/*template <typename T>
T numberFromString(const std::string& str) {
	T number;
	std::istringstream stream(str);
	stream >> number;
	return number;
}*/

Mesh::Mesh()
{

}

Mesh::~Mesh()
{

}

void Mesh::addBuffer(const std::shared_ptr<Buffer>& buffer, const Material& material)
{
	buffersVector.push_back(buffer);

	materialsVector.push_back(material);
}

size_t Mesh::getNumBuffers() const
{
	return buffersVector.size();
}

const std::shared_ptr<Buffer>& Mesh::getBuffer(size_t index) const
{
	shared_ptr<Buffer> pointer = nullptr;

	if (index >= 0 && index < buffersVector.size())
		return buffersVector.at(index);

	return pointer;
}

std::shared_ptr<Buffer>& Mesh::getBuffer(size_t index)
{
	shared_ptr<Buffer> pointer = nullptr;

	if (index >= 0 && index < buffersVector.size())
		return buffersVector.at(index);

	return pointer;
}

const Material& Mesh::getMaterial(size_t index) const
{
	return materialsVector.at(index);
}

Material& Mesh::getMaterial(size_t index)
{
	return materialsVector.at(index);
}


void Mesh::draw()
{
	

	for (int i = 0; i < buffersVector.size(); ++i)
	{
		shared_ptr<Shader> shader = materialsVector.at(i).getShader();

		//Activate the shader
		shader->use();

		// Call the material prepare
		materialsVector.at(i).prepare();

		// Draw the buffer using the shader
		buffersVector.at(i)->draw(shader);

	}
}

std::shared_ptr<Mesh> Mesh::load(
	const char* filename,
	const std::shared_ptr<Shader>& shader)
{
	shared_ptr<Mesh> mesh = make_shared<Mesh>();

	bool includesTexture = false;
	bool includesNormals = false;
	bool includesTangents = false;

	pugi::xml_document doc;
	pugi::xml_parse_result result = doc.load_file(filename);
	if (result) {
		// Cargado correctamente, podemos analizar su contenido ...
		pugi::xml_node meshNode = doc.child("mesh");

		pugi::xml_node buffersNode = meshNode.child("buffers");

		for (pugi::xml_node bufferNode = buffersNode.child("buffer");
			bufferNode;
			bufferNode = bufferNode.next_sibling("buffer"))
		{
			// Iteramos por todos los buffers
			pugi::xml_node materialNode = bufferNode.child("material");

			std::shared_ptr<Texture> texture;
			std::string textureName = materialNode.child("texture").text().as_string();
			if (textureName != "")
			{
				std::string fullTextureName = extractPath(filename) + textureName;
				texture = Texture::load(fullTextureName.c_str());
				includesTexture = true;
			}

			// Color
			glm::vec4 color = glm::vec4(1.0f);
			std::string colorString = materialNode.child("color").text().as_string();
			if (colorString != "")
			{
				std::vector<float> colorVector = splitStr<float>(colorString, ',');
				color = glm::vec4(colorVector.at(0), colorVector.at(1),
					colorVector.at(2), colorVector.at(3));
			}
			else {
				color = glm::vec4(1.0f, 1.0f, 1.0f, 1.0f);
			}


			// shininess
			uint8_t shininess;
			std::string shininessString = materialNode.child("shininess").text().as_string();
			if (shininessString != "")
			{
				shininess = stoi(shininessString);
			}
			else
			{
				shininess = 0;
			}


			// Read Indices from node
			std::vector<uint16_t> indicesVector;
			std::string indices = bufferNode.child("indices").text().as_string();
			if (indices != "")
			{
				indicesVector = splitStr<uint16_t>(indices, ',');
			}
			else
			{
				return nullptr;
			}

			// Read Coordinates from node
			std::vector<float> coordsVector;
			std::string coords = bufferNode.child("coords").text().as_string();
			if (coords != "")
			{
				coordsVector = splitStr<float>(coords, ',');
				std::cout << "Coordenadas: " << coordsVector.at(0) << std::endl;
			}
			else
			{
				return nullptr;
			}

			// Read Texture Coordinates from node
			std::vector<float> texCoordsVector;
			if (includesTexture)
			{
				std::string texcoords = bufferNode.child("texcoords").text().as_string();
				texCoordsVector = splitStr<float>(texcoords, ',');
			}

			// Read Normals from node
			std::vector<float> normalsVector;
			std::string normalsString = bufferNode.child("normals").text().as_string();
			if (normalsString != "")
			{
				normalsVector = splitStr<float>(normalsString, ',');
				includesNormals = true;
			}

			// Read Normals from node
			std::vector<float> tangentsVector;
			std::string tangentsString = bufferNode.child("tangents").text().as_string();
			if (tangentsString != "")
			{
				tangentsVector = splitStr<float>(tangentsString, ',');
				includesTangents = true;
			}


			auto textCoordsIterator = texCoordsVector.begin();
			auto coordsIterator = coordsVector.begin();
			auto normalsIterator = normalsVector.begin();
			auto tangentsIterator = tangentsVector.begin();

			vector<Vertex> vertexVector;

			for (; coordsIterator != coordsVector.end(); 
				coordsIterator += 3)
			{
				Vertex vertex;

				vertex.position = glm::vec3(*coordsIterator, *(coordsIterator + 1), *(coordsIterator + 2));

				if (includesTexture)
				{
					vertex.texture = glm::vec2(*textCoordsIterator, *(textCoordsIterator + 1));
					textCoordsIterator += 2;
				}
				
				if (includesNormals)
				{
					vertex.normal = glm::vec3(*normalsIterator, *(normalsIterator + 1), *(normalsIterator + 2));
					normalsIterator += 3;
				}

				if (includesTangents)
				{
					vertex.tangent = glm::vec3(*tangentsIterator, *(tangentsIterator + 1), *(tangentsIterator + 2));
					tangentsIterator += 3;
				}

				vertexVector.push_back(vertex);
			}

			Material material = Material::Material(texture, nullptr);
			material.setShininess(shininess);
			material.setColor(color);
			material.setCulling(true);
			material.setLighting(true);
			material.setDepthWrite(true);




			std::shared_ptr<Buffer> buffer = Buffer::create(vertexVector, indicesVector);

			mesh->addBuffer(buffer, material);
		}

		return mesh;
	}
	else {
		// No se ha podido cargar
		std::cout << result.description() << std::endl;
		return nullptr;
	}
}

